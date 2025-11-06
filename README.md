AI-Driven Overspeed & ANPR Detection System

This repository contains the source code for the AI-Driven Overspeed & Automatic Number Plate Recognition (ANPR) System, which detects overspeeding vehicles in real-time, extracts vehicle number plates using OCR, and auto-generates challans with evidence in PDF format. The system includes a graphical user interface for traffic authorities to upload footage or run live detection.

Table of Contents

Project Overview

Features

Tech Stack

Folder Structure

Installation

Usage

Configuration

Database

Outputs

Contributing

License

Project Overview

This system automates traffic violation monitoring by detecting overspeeding vehicles, extracting number plates, and generating challan reports with evidence. The application is built to support traffic police, transport authorities, and smart city surveillance setups.

The system provides the ability to:

Detect overspeeding vehicles from video or live camera feed

Extract vehicle number plates using EasyOCR

Generate and store challans in PDF format

Maintain a record of violations using SQLite Database

Provide a GUI interface for authorities to operate the system easily

The tool enhances road safety and provides a step towards automated traffic policing.

Features
🚗 Overspeed Detection

Detects multiple vehicles simultaneously using YOLOv8 object tracking

Calculates vehicle speed using pixel displacement & FPS

Marks vehicles exceeding speed limit with visual warning

🔍 Automatic Number Plate Recognition (ANPR)

Crops the vehicle area and extracts number plate

Enhanced OCR preprocessing for improved accuracy

Supports multiple OCR languages (configurable)

🧾 Auto Challan Generation

Saves evidence image of the violating vehicle

Generates challan as PDF (with plate number, speed, timestamp & image)

Stores entries in database for future reference

🖥️ Graphical User Interface (GUI)

User-friendly Tkinter-based interface

Buttons for Upload Video, Live Detection, and View Challan Records

🗃️ Database Record System

Stores all challans with timestamp, vehicle number, speed & file paths

Maintains long-term data for record and auditing


project/
│── main.py                   
│── yolov8n.pt               
│── challans.db               
│── challans/                  
│── README.md                 
