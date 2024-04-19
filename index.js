import express from "express";
import cors from "cors";
import { VitalSign, db } from "./config.js";
import admin from "./admin-firebaseConfig.js";
const firestore = admin.firestore();
import { getFirestore } from "firebase/firestore";

import bodyParser from "body-parser";

const app = express();

app.use(express.json({ extended: false }));
app.use(bodyParser.json());
app.use(cors({ origin: true, credentials: true }));
app.use(express.urlencoded({ extended: false }));

const port = process.env.port || 4000;

app.post("/post-vital-sign", async (req, res) => {
  try {
    const { patientId, data } = req.body;

    // Get Firestore database reference
    const db = admin.firestore();

    // Check if the patient already exists
    const patientRef = db.collection("VitalSigns").doc(patientId);
    const patientDoc = await patientRef.get();

    if (!patientDoc.exists) {
      // Create a new patient document if it doesn't exist
      await patientRef.set({});
    }

    // Generate the document ID using timestamp
    const timestamp = new Date().toISOString();

    // Add vital sign data to the patient's collection with timestamp as document ID
    const vitalSignsRef = patientRef.collection("VitalSignData").doc(timestamp);
    await vitalSignsRef.set(data);

    res.status(201).json({ message: "Vital signs data stored successfully" });
  } catch (error) {
    console.error("Error storing vital signs data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/get-patient-VitalSign", async (req, res) => {
  try {
    const patientId = req.query.patientId; // Use req.query to access query parameters

    // Get Firestore database reference
    const db = admin.firestore();
    const FieldPath = admin.firestore.FieldPath;

    // Query the VitalSignData sub-collection for the patient's records
    const querySnapshot = await db
      .collection("VitalSigns")
      .doc(patientId)
      .collection("VitalSignData")
      .orderBy(FieldPath.documentId()) // Order by document ID (which is the timestamp)

      .get();

    // Check if there are any documents returned
    if (querySnapshot.empty) {
      return res
        .status(404)
        .json({ message: "No vital sign data found for the patient" });
    }

    // Extract the data from the most recent document
    const mostRecentRecord = querySnapshot.docs[querySnapshot.size - 1].data();

    res.status(200).json({ data: mostRecentRecord });
  } catch (error) {
    console.error("Error retrieving vital sign data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/get-allpatient-VitalSign", async (req, res) => {
  try {
    const patientId = req.query.patientId; // Use req.query to access query parameters

    // Get Firestore database reference
    const db = admin.firestore();

    // Query the VitalSignData sub-collection for the patient's records
    const querySnapshot = await db
      .collection("VitalSigns")
      .doc(patientId)
      .collection("VitalSignData")
      .get();

    // Check if there are any documents returned
    if (querySnapshot.empty) {
      return res
        .status(404)
        .json({ message: "No vital sign data found for the patient" });
    }

    // Extract the data from all documents
    const records = [];
    querySnapshot.forEach((doc) => {
      records.push(doc.data());
    });

    res.status(200).json({ data: records });
  } catch (error) {
    console.error("Error retrieving vital sign data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`App is listening at PORT ${port}`);
});
