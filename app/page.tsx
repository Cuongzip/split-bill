import connectToDatabase from "@/lib/mongodb";
import Bill from "@/models/Bill";

export default async function Home() {
  await connectToDatabase();
  const bills = await Bill.find({}).sort({ createdAt: -1 }).lean();

  return (
    <main style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <h1>Danh sách hoá đơn</h1>

      {bills.length === 0 ? (
        <p>Chưa có hoá đơn nào trong database.</p>
      ) : (
        <ul>
          {bills.map((bill: any) => (
            <li key={bill._id.toString()} style={{ marginBottom: "8px" }}>
              {bill.name }
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
