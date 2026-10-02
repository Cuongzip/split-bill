import fs from "fs";
import path from "path";
import { connectToDatabase } from "./mongodb";
import BillModel from "@/models/Bill";
import ParticipantModel from "@/models/Participant";
import StandaloneProductModel from "@/models/StandaloneProduct";
import SessionModel from "@/models/Session";
import { Participant, Bill, BillProduct, StandaloneProduct, Session } from "./bill-calculator";

interface LocalStoreData {
  participants: Participant[];
  sessions: Session[];
  bills: Bill[];
  standaloneProducts: StandaloneProduct[];
}

const FALLBACK_DIR = path.join(process.cwd(), "data");
const FALLBACK_FILE = path.join(FALLBACK_DIR, "db-fallback.json");

function readFallbackData(): LocalStoreData {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    if (fs.existsSync(FALLBACK_FILE)) {
      const content = fs.readFileSync(FALLBACK_FILE, "utf-8");
      const parsed = JSON.parse(content);
      return {
        participants: parsed.participants || [],
        sessions: parsed.sessions || [],
        bills: parsed.bills || [],
        standaloneProducts: parsed.standaloneProducts || [],
      };
    }
  } catch (err) {
    console.error("Error reading fallback JSON file:", err);
  }

  const emptyData: LocalStoreData = {
    participants: [],
    sessions: [],
    bills: [],
    standaloneProducts: [],
  };
  writeFallbackData(emptyData);
  return emptyData;
}

function writeFallbackData(data: LocalStoreData) {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing fallback JSON file:", err);
  }
}

let isMongoAvailable: boolean | null = null;
let lastMongoCheck = 0;

async function checkMongoConnection(): Promise<boolean> {
  const now = Date.now();
  if (isMongoAvailable !== null && now - lastMongoCheck < 10000) {
    return isMongoAvailable;
  }

  try {
    await connectToDatabase();
    isMongoAvailable = true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("MongoDB connection unavailable, using fallback storage:", msg);
    isMongoAvailable = false;
  }
  lastMongoCheck = now;
  return isMongoAvailable;
}

export async function getDbStatus() {
  const connected = await checkMongoConnection();
  return {
    isMongo: connected,
    storage: connected ? "mongodb" : "local_file_fallback",
  };
}

export async function getParticipants(): Promise<Participant[]> {
  const useMongo = await checkMongoConnection();
  if (useMongo) {
    const docs = await ParticipantModel.find({}).sort({ createdAt: 1 }).lean();
    return docs.map((d) => ({
      id: d.id,
      name: d.name,
      avatar: d.avatar,
      color: d.color,
    }));
  }

  const data = readFallbackData();
  return data.participants;
}

export async function createParticipant(p: Partial<Participant>): Promise<Participant> {
  const newParticipant: Participant = {
    id: p.id || `p_${Date.now()}`,
    name: p.name?.trim() || "Thành viên",
    avatar: p.avatar || "",
    color: p.color || "bg-emerald-500 text-white",
  };

  const useMongo = await checkMongoConnection();
  if (useMongo) {
    await ParticipantModel.create(newParticipant);
    return newParticipant;
  }

  const data = readFallbackData();
  data.participants.push(newParticipant);
  writeFallbackData(data);
  return newParticipant;
}

export async function updateParticipant(
  id: string,
  update: Partial<Participant>
): Promise<Participant | null> {
  const useMongo = await checkMongoConnection();
  if (useMongo) {
    const doc = await ParticipantModel.findOneAndUpdate(
      { id },
      { $set: update },
      { new: true }
    ).lean();
    if (!doc) return null;
    return {
      id: doc.id,
      name: doc.name,
      avatar: doc.avatar,
      color: doc.color,
    };
  }

  const data = readFallbackData();
  const idx = data.participants.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  data.participants[idx] = { ...data.participants[idx], ...update };
  writeFallbackData(data);
  return data.participants[idx];
}

export async function deleteParticipant(id: string): Promise<boolean> {
  const useMongo = await checkMongoConnection();
  if (useMongo) {
    await ParticipantModel.deleteOne({ id });
    await BillModel.updateMany(
      {},
      { $pull: { "products.$[].participantIds": id } }
    );
    await StandaloneProductModel.updateMany(
      {},
      { $pull: { participantIds: id } }
    );
    return true;
  }

  const data = readFallbackData();
  data.participants = data.participants.filter((p) => p.id !== id);
  for (const b of data.bills) {
    for (const prod of b.products) {
      prod.participantIds = prod.participantIds.filter((pid) => pid !== id);
    }
  }
  for (const s of data.standaloneProducts) {
    s.participantIds = s.participantIds.filter((pid) => pid !== id);
  }
  writeFallbackData(data);
  return true;
}

export async function getBills(sessionId?: string): Promise<Bill[]> {
  const useMongo = await checkMongoConnection();
  if (useMongo) {
    const filter = sessionId ? { sessionId } : {};
    const docs = await BillModel.find(filter).sort({ createdAt: -1 }).lean();
    return docs.map((d) => ({
      id: d.id,
      sessionId: d.sessionId || "default",
      title: d.title,
      date: d.date,
      image: d.image,
      totalAmount: d.totalAmount || undefined,
      products: d.products.map((prod) => ({
        id: prod.id,
        name: prod.name,
        price: prod.price,
        participantIds: prod.participantIds || [],
      })),
    }));
  }

  const data = readFallbackData();
  if (sessionId) {
    return data.bills.filter((b) => b.sessionId === sessionId);
  }
  return data.bills;
}

export async function getBillById(id: string): Promise<Bill | null> {
  const useMongo = await checkMongoConnection();
  if (useMongo) {
    const doc = await BillModel.findOne({ id }).lean();
    if (!doc) return null;
    return {
      id: doc.id,
      sessionId: doc.sessionId || "default",
      title: doc.title,
      date: doc.date,
      image: doc.image,
      totalAmount: doc.totalAmount || undefined,
      products: doc.products.map((prod) => ({
        id: prod.id,
        name: prod.name,
        price: prod.price,
        participantIds: prod.participantIds || [],
      })),
    };
  }

  const data = readFallbackData();
  return data.bills.find((b) => b.id === id) || null;
}

export async function createBill(billData: Partial<Bill>): Promise<Bill> {
  const allParticipants = await getParticipants();
  const allPids = allParticipants.map((p) => p.id);

  const products = (billData.products || []).map((prod) => ({
    id: prod.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: prod.name,
    price: prod.price,
    participantIds:
      prod.participantIds && prod.participantIds.length > 0
        ? prod.participantIds
        : allPids,
  }));

  const newBill: Bill = {
    id: billData.id || `bill_${Date.now()}`,
    sessionId: billData.sessionId || "default",
    title: billData.title?.trim() || "Hoá đơn mới",
    date:
      billData.date ||
      new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    image: billData.image || "",
    totalAmount: billData.totalAmount,
    products,
  };

  const useMongo = await checkMongoConnection();
  if (useMongo) {
    await BillModel.create(newBill);
    return newBill;
  }

  const data = readFallbackData();
  data.bills = [newBill, ...data.bills];
  writeFallbackData(data);
  return newBill;
}

export async function updateBill(
  id: string,
  update: Partial<Bill>
): Promise<Bill | null> {
  const useMongo = await checkMongoConnection();
  if (useMongo) {
    const doc = await BillModel.findOneAndUpdate(
      { id },
      { $set: update },
      { new: true }
    ).lean();
    if (!doc) return null;
    return {
      id: doc.id,
      sessionId: doc.sessionId || "default",
      title: doc.title,
      date: doc.date,
      image: doc.image,
      totalAmount: doc.totalAmount || undefined,
      products: doc.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        participantIds: p.participantIds || [],
      })),
    };
  }

  const data = readFallbackData();
  const idx = data.bills.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  data.bills[idx] = { ...data.bills[idx], ...update };
  writeFallbackData(data);
  return data.bills[idx];
}

export async function deleteBill(id: string): Promise<boolean> {
  const useMongo = await checkMongoConnection();
  if (useMongo) {
    await BillModel.deleteOne({ id });
    return true;
  }

  const data = readFallbackData();
  data.bills = data.bills.filter((b) => b.id !== id);
  writeFallbackData(data);
  return true;
}

export async function addProductToBill(
  billId: string,
  product: BillProduct
): Promise<Bill | null> {
  const allParticipants = await getParticipants();
  const allPids = allParticipants.map((p) => p.id);

  const finalProduct: BillProduct = {
    ...product,
    participantIds:
      product.participantIds && product.participantIds.length > 0
        ? product.participantIds
        : allPids,
  };

  const useMongo = await checkMongoConnection();
  if (useMongo) {
    const doc = await BillModel.findOneAndUpdate(
      { id: billId },
      { $push: { products: finalProduct } },
      { new: true }
    ).lean();
    if (!doc) return null;
    return {
      id: doc.id,
      sessionId: doc.sessionId || "default",
      title: doc.title,
      date: doc.date,
      image: doc.image,
      totalAmount: doc.totalAmount || undefined,
      products: doc.products,
    };
  }

  const data = readFallbackData();
  const bill = data.bills.find((b) => b.id === billId);
  if (!bill) return null;
  bill.products.push(finalProduct);
  writeFallbackData(data);
  return bill;
}

export async function updateBillProduct(
  billId: string,
  productId: string,
  update: Partial<BillProduct>
): Promise<Bill | null> {
  const useMongo = await checkMongoConnection();
  if (useMongo) {
    const bill = await BillModel.findOne({ id: billId });
    if (!bill) return null;

    const prod = bill.products.find((p) => p.id === productId);
    if (!prod) return null;

    if (update.name !== undefined) prod.name = update.name;
    if (update.price !== undefined) prod.price = update.price;
    if (update.participantIds !== undefined)
      prod.participantIds = update.participantIds;

    await bill.save();
    return {
      id: bill.id,
      sessionId: bill.sessionId || "default",
      title: bill.title,
      date: bill.date,
      image: bill.image,
      totalAmount: bill.totalAmount || undefined,
      products: bill.products,
    };
  }

  const data = readFallbackData();
  const bill = data.bills.find((b) => b.id === billId);
  if (!bill) return null;
  const prod = bill.products.find((p) => p.id === productId);
  if (!prod) return null;

  if (update.name !== undefined) prod.name = update.name;
  if (update.price !== undefined) prod.price = update.price;
  if (update.participantIds !== undefined)
    prod.participantIds = update.participantIds;

  writeFallbackData(data);
  return bill;
}

export async function deleteBillProduct(
  billId: string,
  productId: string
): Promise<Bill | null> {
  const useMongo = await checkMongoConnection();
  if (useMongo) {
    const doc = await BillModel.findOneAndUpdate(
      { id: billId },
      { $pull: { products: { id: productId } } },
      { new: true }
    ).lean();
    if (!doc) return null;
    return {
      id: doc.id,
      sessionId: doc.sessionId || "default",
      title: doc.title,
      date: doc.date,
      image: doc.image,
      totalAmount: doc.totalAmount || undefined,
      products: doc.products,
    };
  }

  const data = readFallbackData();
  const bill = data.bills.find((b) => b.id === billId);
  if (!bill) return null;
  bill.products = bill.products.filter((p) => p.id !== productId);
  writeFallbackData(data);
  return bill;
}

export async function getStandaloneProducts(sessionId?: string): Promise<StandaloneProduct[]> {
  const useMongo = await checkMongoConnection();
  if (useMongo) {
    const filter = sessionId ? { sessionId } : {};
    const docs = await StandaloneProductModel.find(filter)
      .sort({ createdAt: 1 })
      .lean();
    return docs.map((d) => ({
      id: d.id,
      sessionId: d.sessionId || "default",
      name: d.name,
      price: d.price,
      participantIds: d.participantIds || [],
      note: d.note,
    }));
  }

  const data = readFallbackData();
  if (sessionId) {
    return data.standaloneProducts.filter((s) => s.sessionId === sessionId);
  }
  return data.standaloneProducts;
}

export async function createStandaloneProduct(
  p: Partial<StandaloneProduct>
): Promise<StandaloneProduct> {
  const allParticipants = await getParticipants();
  const allPids = allParticipants.map((part) => part.id);

  const newProduct: StandaloneProduct = {
    id: p.id || `s_${Date.now()}`,
    sessionId: p.sessionId || "default",
    name: p.name?.trim() || "Chi phí riêng",
    price: p.price || 0,
    participantIds:
      p.participantIds && p.participantIds.length > 0
        ? p.participantIds
        : allPids,
    note: p.note || "",
  };

  const useMongo = await checkMongoConnection();
  if (useMongo) {
    await StandaloneProductModel.create(newProduct);
    return newProduct;
  }

  const data = readFallbackData();
  data.standaloneProducts.push(newProduct);
  writeFallbackData(data);
  return newProduct;
}

export async function updateStandaloneProduct(
  id: string,
  update: Partial<StandaloneProduct>
): Promise<StandaloneProduct | null> {
  const useMongo = await checkMongoConnection();
  if (useMongo) {
    const doc = await StandaloneProductModel.findOneAndUpdate(
      { id },
      { $set: update },
      { new: true }
    ).lean();
    if (!doc) return null;
    return {
      id: doc.id,
      sessionId: doc.sessionId || "default",
      name: doc.name,
      price: doc.price,
      participantIds: doc.participantIds || [],
      note: doc.note,
    };
  }

  const data = readFallbackData();
  const idx = data.standaloneProducts.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  data.standaloneProducts[idx] = { ...data.standaloneProducts[idx], ...update };
  writeFallbackData(data);
  return data.standaloneProducts[idx];
}

export async function deleteStandaloneProduct(id: string): Promise<boolean> {
  const useMongo = await checkMongoConnection();
  if (useMongo) {
    await StandaloneProductModel.deleteOne({ id });
    return true;
  }

  const data = readFallbackData();
  data.standaloneProducts = data.standaloneProducts.filter((p) => p.id !== id);
  writeFallbackData(data);
  return true;
}

export async function resetAllData(): Promise<LocalStoreData> {
  const useMongo = await checkMongoConnection();
  if (useMongo) {
    await ParticipantModel.deleteMany({});
    await BillModel.deleteMany({});
    await StandaloneProductModel.deleteMany({});
    await SessionModel.deleteMany({});
  }

  const emptyData: LocalStoreData = {
    participants: [],
    sessions: [],
    bills: [],
    standaloneProducts: [],
  };
  writeFallbackData(emptyData);
  return emptyData;
}

export async function getSessions(): Promise<Session[]> {
  const useMongo = await checkMongoConnection();
  if (useMongo) {
    const docs = await SessionModel.find({}).sort({ createdAt: 1 }).lean();
    return docs.map((d) => ({
      id: d.id,
      name: d.name,
      date: d.date,
      color: d.color,
    }));
  }

  const data = readFallbackData();
  return data.sessions || [];
}

export async function createSession(s: Partial<Session>): Promise<Session> {
  const newSession: Session = {
    id: s.id || `session_${Date.now()}`,
    name: s.name?.trim() || "Nhóm mới",
    date:
      s.date ||
      new Date().toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    color: s.color || "bg-blue-500",
  };

  const useMongo = await checkMongoConnection();
  if (useMongo) {
    await SessionModel.create(newSession);
    return newSession;
  }

  const data = readFallbackData();
  if (!data.sessions) data.sessions = [];
  data.sessions.push(newSession);
  writeFallbackData(data);
  return newSession;
}

export async function updateSession(
  id: string,
  update: Partial<Session>
): Promise<Session | null> {
  const useMongo = await checkMongoConnection();
  if (useMongo) {
    const doc = await SessionModel.findOneAndUpdate(
      { id },
      { $set: update },
      { new: true }
    ).lean();
    if (!doc) return null;
    return {
      id: doc.id,
      name: doc.name,
      date: doc.date,
      color: doc.color,
    };
  }

  const data = readFallbackData();
  if (!data.sessions) data.sessions = [];
  const idx = data.sessions.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  data.sessions[idx] = { ...data.sessions[idx], ...update };
  writeFallbackData(data);
  return data.sessions[idx];
}

export async function deleteSession(id: string): Promise<boolean> {
  const useMongo = await checkMongoConnection();
  if (useMongo) {
    await SessionModel.deleteOne({ id });
    await BillModel.deleteMany({ sessionId: id });
    await StandaloneProductModel.deleteMany({ sessionId: id });
    return true;
  }

  const data = readFallbackData();
  if (!data.sessions) data.sessions = [];
  data.sessions = data.sessions.filter((s) => s.id !== id);
  data.bills = data.bills.filter((b) => b.sessionId !== id);
  data.standaloneProducts = data.standaloneProducts.filter(
    (s) => s.sessionId !== id
  );
  writeFallbackData(data);
  return true;
}
