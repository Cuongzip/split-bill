import { connectToDatabase } from "./mongodb";
import BillModel from "@/models/Bill";
import ParticipantModel from "@/models/Participant";
import StandaloneProductModel from "@/models/StandaloneProduct";
import SessionModel from "@/models/Session";
import { Participant, Bill, BillProduct, StandaloneProduct, Session } from "./bill-calculator";

export async function getDbStatus() {
  try {
    const mongooseInstance = await connectToDatabase();
    const isConnected = mongooseInstance.connection.readyState === 1;
    return {
      isMongo: isConnected,
      storage: "mongodb",
      database: mongooseInstance.connection.name || "split_bill",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      isMongo: false,
      storage: "mongodb",
      error: msg,
    };
  }
}

export async function getParticipants(): Promise<Participant[]> {
  await connectToDatabase();
  const docs = await ParticipantModel.find({}).sort({ createdAt: 1 }).lean();
  return docs.map((d) => ({
    id: d.id,
    name: d.name,
    avatar: d.avatar,
    color: d.color,
  }));
}

export async function createParticipant(p: Partial<Participant>): Promise<Participant> {
  await connectToDatabase();
  const newParticipant: Participant = {
    id: p.id || `p_${Date.now()}`,
    name: p.name?.trim() || "Thành viên",
    avatar: p.avatar || "",
    color: p.color || "bg-emerald-500 text-white",
  };

  await ParticipantModel.create(newParticipant);
  return newParticipant;
}

export async function updateParticipant(
  id: string,
  update: Partial<Participant>
): Promise<Participant | null> {
  await connectToDatabase();
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

export async function deleteParticipant(id: string): Promise<boolean> {
  await connectToDatabase();
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

export async function getBills(sessionId?: string): Promise<Bill[]> {
  await connectToDatabase();
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

export async function getBillById(id: string): Promise<Bill | null> {
  await connectToDatabase();
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

export async function createBill(billData: Partial<Bill>): Promise<Bill> {
  await connectToDatabase();
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

  await BillModel.create(newBill);
  return newBill;
}

export async function updateBill(
  id: string,
  update: Partial<Bill>
): Promise<Bill | null> {
  await connectToDatabase();
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

export async function deleteBill(id: string): Promise<boolean> {
  await connectToDatabase();
  await BillModel.deleteOne({ id });
  return true;
}

export async function addProductToBill(
  billId: string,
  product: BillProduct
): Promise<Bill | null> {
  await connectToDatabase();
  const allParticipants = await getParticipants();
  const allPids = allParticipants.map((p) => p.id);

  const finalProduct: BillProduct = {
    ...product,
    participantIds:
      product.participantIds && product.participantIds.length > 0
        ? product.participantIds
        : allPids,
  };

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

export async function updateBillProduct(
  billId: string,
  productId: string,
  update: Partial<BillProduct>
): Promise<Bill | null> {
  await connectToDatabase();
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

export async function deleteBillProduct(
  billId: string,
  productId: string
): Promise<Bill | null> {
  await connectToDatabase();
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

export async function getStandaloneProducts(sessionId?: string): Promise<StandaloneProduct[]> {
  await connectToDatabase();
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

export async function createStandaloneProduct(
  p: Partial<StandaloneProduct>
): Promise<StandaloneProduct> {
  await connectToDatabase();
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

  await StandaloneProductModel.create(newProduct);
  return newProduct;
}

export async function updateStandaloneProduct(
  id: string,
  update: Partial<StandaloneProduct>
): Promise<StandaloneProduct | null> {
  await connectToDatabase();
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

export async function deleteStandaloneProduct(id: string): Promise<boolean> {
  await connectToDatabase();
  await StandaloneProductModel.deleteOne({ id });
  return true;
}

export async function resetAllData() {
  await connectToDatabase();
  await ParticipantModel.deleteMany({});
  await BillModel.deleteMany({});
  await StandaloneProductModel.deleteMany({});
  await SessionModel.deleteMany({});

  return {
    participants: [],
    sessions: [],
    bills: [],
    standaloneProducts: [],
  };
}

export async function getSessions(): Promise<Session[]> {
  await connectToDatabase();
  const docs = await SessionModel.find({}).sort({ createdAt: -1 }).lean();
  return docs.map((d) => ({
    id: d.id,
    name: d.name,
    date: d.date,
    color: d.color,
  }));
}

export async function createSession(s: Partial<Session>): Promise<Session> {
  await connectToDatabase();
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

  await SessionModel.create(newSession);
  return newSession;
}

export async function updateSession(
  id: string,
  update: Partial<Session>
): Promise<Session | null> {
  await connectToDatabase();
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

export async function deleteSession(id: string): Promise<boolean> {
  await connectToDatabase();
  await SessionModel.deleteOne({ id });
  await BillModel.deleteMany({ sessionId: id });
  await StandaloneProductModel.deleteMany({ sessionId: id });
  return true;
}
