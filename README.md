*DEMO VIDEO
https://github.com/user-attachments/assets/d43a1390-32ca-49b3-a868-dc103117198a
**Terminal 1:**
```bash
python kdd_mqtt_sender.py --name "Computer-1" --limit 100
```

**Terminal 2:**
```bash
python kdd_mqtt_sender.py --name "Computer-2" --limit 100
```

**Terminal 3:**
```bash
python kdd_mqtt_sender.py --name "Computer-3" --limit 100
```

Dashboard
**Terminal 2 - Start Frontend:**
```bash
cd frontend/vite-project
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

**Terminal 1 - Start Backend:**
```bash
cd backend
python app.py
```
