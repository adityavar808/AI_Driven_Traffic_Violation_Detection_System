import cv2
import numpy as np
import time
import os
import threading
import sqlite3
from datetime import datetime
from ultralytics import YOLO
import easyocr
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from PIL import Image
from tkinter import *
from tkinter import filedialog, messagebox

# ---------------- CONFIG ----------------
MODEL_PATH = "yolov8n.pt"   # change if you have different yolov8 model
SPEED_LIMIT = 80            # km/h
PIXEL_TO_METER = 0.05       # calibrate for your scene
SAVE_DIR = "challans"       # folder to save evidence & pdfs
DB_PATH = "challans.db"
OCR_LANGS = ['en']          # EasyOCR languages - add more if needed
DETECTION_CLASSES = [2,3,5,7]  # car, motorcycle, bus, truck (COCO class indices)

# create directories
os.makedirs(SAVE_DIR, exist_ok=True)

# ---------------- MODELS & DB ----------------
print("Loading YOLO model...")
model = YOLO(MODEL_PATH)  # ensure yolov8n.pt present or change path
print("Loading OCR model (this may take some seconds)...")
reader = easyocr.Reader(OCR_LANGS, gpu=False)  # set gpu=True if available

# sqlite DB init
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
c = conn.cursor()
c.execute('''
    CREATE TABLE IF NOT EXISTS challans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        plate TEXT,
        speed REAL,
        image_path TEXT,
        pdf_path TEXT
    )
''')
conn.commit()

# ---------------- UTILITIES ----------------
def estimate_speed(p1, p2, fps):
    """Estimate speed in km/h from two centers (pixels) and fps."""
    distance_pixels = np.linalg.norm(np.array(p2) - np.array(p1))
    distance_meters = distance_pixels * PIXEL_TO_METER
    # frame-to-frame time = 1/fps seconds, but measured displacement per frame,
    # so speed_mps = distance_meters * fps
    speed_mps = distance_meters * fps
    speed_kmph = speed_mps * 3.6
    return speed_kmph

def save_challan(plate_text, speed, crop_img):
    """Save image, create pdf challan, insert into sqlite DB, return paths."""
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_plate = plate_text.replace(" ", "_") if plate_text else "UNKNOWN"
    image_name = f"{SAVE_DIR}/evidence_{safe_plate}_{ts}.jpg"
    pdf_name = f"{SAVE_DIR}/challan_{safe_plate}_{ts}.pdf"
    # save image
    cv2.imwrite(image_name, crop_img)

    # create pdf with reportlab
    cpdf = canvas.Canvas(pdf_name, pagesize=A4)
    width, height = A4
    cpdf.setFont("Helvetica-Bold", 16)
    cpdf.drawString(40, height - 60, "Traffic Challan / Overspeed Notice")
    cpdf.setFont("Helvetica", 12)
    cpdf.drawString(40, height - 100, f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    cpdf.drawString(40, height - 120, f"Detected Plate: {plate_text}")
    cpdf.drawString(40, height - 140, f"Recorded Speed: {speed:.1f} km/h")
    # place image (scale to fit)
    im = Image.open(image_name)
    max_w = width - 80
    max_h = height/2
    im_w, im_h = im.size
    scale = min(max_w/im_w, max_h/im_h, 1)
    new_w = int(im_w * scale)
    new_h = int(im_h * scale)
    im = im.resize((new_w, new_h))
    im.save(f"{SAVE_DIR}/tmp_{ts}.jpg")
    cpdf.drawImage(f"{SAVE_DIR}/tmp_{ts}.jpg", 40, height - 160 - new_h, width=new_w, height=new_h)
    cpdf.showPage()
    cpdf.save()
    # cleanup temp
    try:
        os.remove(f"{SAVE_DIR}/tmp_{ts}.jpg")
    except:
        pass

    # DB record
    cur = conn.cursor()
    cur.execute("INSERT INTO challans (timestamp, plate, speed, image_path, pdf_path) VALUES (?, ?, ?, ?, ?)",
                (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), plate_text, speed, image_name, pdf_name))
    conn.commit()
    return image_name, pdf_name

def enhance_plate_for_ocr(plate_img):
    """Preprocess crop to improve OCR: grayscale, bilateral filter, threshold."""
    gray = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
    # bilateral for denoise but keep edges
    b = cv2.bilateralFilter(gray, 9, 75, 75)
    # adaptive threshold
    th = cv2.adaptiveThreshold(b, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                               cv2.THRESH_BINARY, 11, 2)
    return th

def read_plate_text(crop_img):
    """Run EasyOCR on crop and return best text (string)."""
    try:
        # small resize to keep OCR stable
        h, w = crop_img.shape[:2]
        scale = 600 / max(w, h) if max(w,h) < 1000 else 1.0
        if scale != 1.0:
            crop_img = cv2.resize(crop_img, (int(w*scale), int(h*scale)))
        # preprocess to help OCR
        proc = enhance_plate_for_ocr(crop_img)
        # EasyOCR expects RGB or grayscale array
        result = reader.readtext(proc)
        # choose longest/highest-confidence string
        texts = [t[1] for t in result if len(t[1]) >= 3]
        if not texts:
            return ""
        # heuristic: pick text with highest sum of confidences times length
        best = sorted(result, key=lambda x: (len(x[1]) * x[2]), reverse=True)[0]
        return best[1]
    except Exception as e:
        print("OCR error:", e)
        return ""

# ---------------- PROCESS VIDEO & TRACK ----------------
def process_video(source, on_challan_callback=None):
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        messagebox.showerror("Error", "Could not open video source!")
        return

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    prev_positions = {}  # track_id -> center
    seen_challans = set()  # avoid duplicate challans for same track id immediately

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # YOLOv8 track API
        results = model.track(frame, persist=True, classes=DETECTION_CLASSES)
        res = results[0]
        boxes = []
        ids = []
        if hasattr(res, 'boxes') and res.boxes is not None and len(res.boxes) > 0:
            # res.boxes.xyxy and res.boxes.id are tensors; convert properly
            try:
                xyxy = res.boxes.xyxy.cpu().numpy()
                ids_list = res.boxes.id.cpu().numpy().astype(int)
            except:
                xyxy = np.array(res.boxes.xyxy)
                ids_list = np.array(res.boxes.id).astype(int)

            for box, tid in zip(xyxy, ids_list):
                x1, y1, x2, y2 = map(int, box)
                center = ((x1 + x2)//2, (y1 + y2)//2)

                # draw bounding box
                cv2.rectangle(frame, (x1,y1), (x2,y2), (200,200,0), 2)
                cv2.putText(frame, f"ID:{tid}", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200,200,0), 1)

                if tid in prev_positions:
                    speed = estimate_speed(prev_positions[tid], center, fps)
                    color = (0,0,255) if speed > SPEED_LIMIT else (0,255,0)
                    cv2.putText(frame, f"{int(speed)} km/h", (x1, y2+20), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
                    if speed > SPEED_LIMIT:
                        cv2.rectangle(frame, (x1,y1), (x2,y2), (0,0,255), 3)
                        cv2.putText(frame, "Overspeeding!", (x1, y1-30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,255), 2)

                        # if not already challaned recently for this track id, create challan
                        if tid not in seen_challans:
                            # crop vehicle region with some padding
                            pad = 10
                            cx1 = max(0, x1-pad); cy1 = max(0, y1-pad)
                            cx2 = min(frame.shape[1], x2+pad); cy2 = min(frame.shape[0], y2+pad)
                            vehicle_crop = frame[cy1:cy2, cx1:cx2].copy()

                            # quick heuristic to guess plate area: bottom third of vehicle crop
                            vh = vehicle_crop.shape[0]
                            ph1 = int(vh*0.6); ph2 = vh
                            plate_region = vehicle_crop[ph1:ph2, :]
                            if plate_region.size == 0:
                                plate_region = vehicle_crop

                            # OCR
                            plate_text = read_plate_text(plate_region)
                            print("Detected plate:", plate_text)

                            # create challan (save image + pdf + db)
                            image_path, pdf_path = save_challan(plate_text or "UNKNOWN", speed, vehicle_crop)
                            seen_challans.add(tid)

                            # callback to GUI to show challan info (if provided)
                            if on_challan_callback:
                                on_challan_callback(plate_text or "UNKNOWN", speed, image_path, pdf_path)

                prev_positions[tid] = center

        cv2.imshow("Overspeed Detection + ANPR", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

# ---------------- TKINTER GUI ----------------
def run_in_thread(func, *args):
    thread = threading.Thread(target=func, args=args, daemon=True)
    thread.start()

def on_challan(plate, speed, img_path, pdf_path):
    """GUI callback when a challan is created."""
    # Show a message box with details
    msg = f"Challan created!\nPlate: {plate}\nSpeed: {speed:.1f} km/h\nSaved image: {img_path}\nSaved PDF: {pdf_path}"
    # use a non-blocking messagebox via root.after
    root.after(0, lambda: messagebox.showinfo("Challan Created", msg))

def upload_video():
    file_path = filedialog.askopenfilename(title="Select Video File", filetypes=[("Video Files","*.mp4 *.avi *.mkv")])
    if file_path:
        messagebox.showinfo("Processing", "Press 'q' in the video window to stop processing.")
        run_in_thread(process_video, file_path, on_challan)

def start_live():
    messagebox.showinfo("Live Stream", "Press 'q' in the video window to stop.")
    run_in_thread(process_video, 0, on_challan)

# Build GUI
root = Tk()
root.title("Overspeed Detection + ANPR")
root.geometry("420x320")
root.config(bg="#222")

title = Label(root, text="Overspeed Detection + ANPR", font=("Arial",16,"bold"), fg="white", bg="#222")
title.pack(pady=20)

btn_upload = Button(root, text="Upload Video", font=("Arial",12), width=20, command=upload_video)
btn_upload.pack(pady=8)

btn_live = Button(root, text="Start Live Stream", font=("Arial",12), width=20, command=start_live)
btn_live.pack(pady=8)

btn_view_db = Button(root, text="View Saved Challans (open folder)", font=("Arial",10), width=30,
                     command=lambda: os.startfile(os.path.abspath(SAVE_DIR)) )
btn_view_db.pack(pady=10)

btn_exit = Button(root, text="Exit", font=("Arial",12), width=20, command=root.destroy)
btn_exit.pack(pady=10)

footer = Label(root, text="Challan records saved in folder 'challans' and DB 'challans.db'", fg="lightgray", bg="#222", font=("Arial",9))
footer.pack(side="bottom", pady=8)

root.mainloop()

# import cv2
# img = cv2.imread("test.jpg")  # any image
# cv2.imshow("Test", img)
# cv2.waitKey(0)
# cv2.destroyAllWindows()
