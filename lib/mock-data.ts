import { Participant, Bill, StandaloneProduct } from "./bill-calculator";

export const INITIAL_PARTICIPANTS: Participant[] = [
  { id: "p1", name: "Cường", color: "bg-emerald-500 text-white" },
  { id: "p2", name: "Bảo", color: "bg-blue-500 text-white" },
  { id: "p3", name: "An", color: "bg-amber-500 text-white" },
  { id: "p4", name: "Dũng", color: "bg-purple-500 text-white" },
];

export const INITIAL_BILLS: Bill[] = [
  {
    id: "b1",
    title: "BILL #1",
    date: "Hôm nay, 19:30",
    image: "/receipt-sample-1.svg",
    products: [
      {
        id: "b1_p1",
        name: "Thịt heo",
        price: 51000,
        participantIds: ["p1", "p2", "p3"],
      },
      {
        id: "b1_p2",
        name: "Rau cải",
        price: 25000,
        participantIds: ["p1", "p2", "p3"],
      },
      {
        id: "b1_p3",
        name: "Coca",
        price: 30000,
        participantIds: ["p1"],
      },
      {
        id: "b1_p4",
        name: "Mì",
        price: 37000,
        participantIds: ["p1", "p2", "p3"],
      },
    ],
  },
  {
    id: "b2",
    title: "BILL #2",
    date: "Hôm nay, 21:15",
    image: "/receipt-sample-2.svg",
    products: [
      {
        id: "b2_p1",
        name: "Trà sữa Ô Long",
        price: 38000,
        participantIds: ["p2", "p3"],
      },
      {
        id: "b2_p2",
        name: "Cà phê muối",
        price: 28000,
        participantIds: ["p1", "p4"],
      },
      {
        id: "b2_p3",
        name: "Bánh tráng nướng",
        price: 35000,
        participantIds: ["p1", "p2", "p3", "p4"],
      },
    ],
  },
];

export const INITIAL_STANDALONE: StandaloneProduct[] = [
  {
    id: "s1",
    name: "Đá viên",
    price: 20000,
    participantIds: ["p1", "p2", "p3"],
    note: "Mua thêm tiệm tạp hóa",
  },
  {
    id: "s2",
    name: "Phí ship Grab",
    price: 18000,
    participantIds: ["p1", "p2", "p3", "p4"],
    note: "Giao đồ ăn",
  },
];

export const PRESET_SAMPLE_BILLS = [
  {
    title: "Lẩu Nấm Gia Đình",
    products: [
      { name: "Set lẩu nấm thập cẩm", price: 185000 },
      { name: "Bò ba chỉ Mỹ", price: 95000 },
      { name: "Nước ngọt 7Up (2 lon)", price: 32000 },
      { name: "Nấm kim châm thêm", price: 25000 },
    ],
  },
  {
    title: "Quán Nướng Vỉa Hè",
    products: [
      { name: "Sườn que nướng mật ong", price: 120000 },
      { name: "Bạch tuộc sa tế", price: 85000 },
      { name: "Bia Heineken (4 lon)", price: 88000 },
      { name: "Đậu bắp nướng", price: 20000 },
    ],
  },
];
