import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

const day = (n) => Timestamp.fromDate(new Date(Date.now() + n * 86400000));

export async function seedFilters() {
  const list = [
    { name: "Filter 1", location: "Library", flow: true, tds: null, lastService: day(-40), nextService: day(50), updatedAt: null },
    { name: "Filter 2", location: "Canteen", flow: true, tds: null, lastService: day(-40), nextService: day(50), updatedAt: null },
    { name: "Filter 3", location: "IT department", flow: true, tds: null, lastService: day(-40), nextService: day(50), updatedAt: null },
    { name: "Filter 4", location: "Main Building", flow: true, tds: null, lastService: day(-40), nextService: day(50), updatedAt: null },
  ];
  for (const f of list) await addDoc(collection(db, "filters"), f);
}