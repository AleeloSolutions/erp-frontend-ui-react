export interface DemoCustomer {
  id: string;
  name: string;
  email: string;
  test: string;
  phone: string;
  status: "Active" | "Inactive";
  created: string;
}

export interface DemoInvoice {
  id: string;
  number: string;
  customer: string;
  date: string;
  dueDate: string;
  status:
    | "Paid"
    | "Pending"
    | "Approved"
    | "Overdue"
    | "Draft"
    | "Partially paid";
  amount: string;
}

export interface DemoQuotation {
  id: string;
  number: string;
  customer: string;
  date: string;
  validUntil: string;
  status: "Draft" | "Pending" | "Approved";
  amount: string;
}

export const mockCustomers: DemoCustomer[] = [
  {
    id: "1",
    name: "HornRise Group",
    email: "finance@hornrise.so",
    test: "test",
    phone: "615100037",
    status: "Active",
    created: "02 Jul 2026",
  },
  {
    id: "2",
    name: "Somali Development Agency",
    email: "accounts@sda.so",
    test: "test",
    phone: "615100074",
    status: "Active",
    created: "05 Jul 2026",
  },
  {
    id: "3",
    name: "East Africa Supplies Ltd",
    email: "billing@eas.africa",
    test: "test",
    phone: "615100111",
    status: "Inactive",
    created: "08 Jul 2026",
  },
  {
    id: "4",
    name: "Galmudug Education Office",
    email: "procurement@geo.so",
    test: "test",
    phone: "615100148",
    status: "Active",
    created: "11 Jul 2026",
  },
  {
    id: "5",
    name: "Jubba Logistics",
    email: "ops@jubbalogistics.so",
    test: "test",
    phone: "615100185",
    status: "Active",
    created: "14 Jul 2026",
  },
  {
    id: "6",
    name: "Somtel Business",
    email: "corp@somtel.so",
    test: "test",
    phone: "615100222",
    status: "Inactive",
    created: "17 Jul 2026",
  },
  {
    id: "7",
    name: "Mogadishu Medical Center",
    email: "admin@mmc.so",
    test: "test",
    phone: "615100259",
    status: "Active",
    created: "20 Jul 2026",
  },
  {
    id: "8",
    name: "Puntland Agriculture Agency",
    email: "finance@paa.so",
    test: "test",
    phone: "615100296",
    status: "Active",
    created: "23 Jul 2026",
  },
  {
    id: "9",
    name: "Daryeel Construction",
    email: "projects@daryeel.so",
    test: "test",
    phone: "615100333",
    status: "Inactive",
    created: "26 Jul 2026",
  },
  {
    id: "10",
    name: "Bilan Trading",
    email: "sales@bilan.so",
    test: "test",
    phone: "615100370",
    status: "Active",
    created: "29 Jul 2026",
  },
  {
    id: "11",
    name: "Nugaal Retail Co",
    email: "info@nugaal.so",
    test: "test",
    phone: "615100407",
    status: "Active",
    created: "01 Aug 2026",
  },
  {
    id: "12",
    name: "Banadir Services",
    email: "contact@banadir.so",
    test: "test",
    phone: "615100444",
    status: "Inactive",
    created: "04 Aug 2026",
  },
];

export const mockInvoices: DemoInvoice[] = [
  {
    id: "1",
    number: "INV-2026-0001",
    customer: "HornRise Group",
    date: "01 Jul 2026",
    dueDate: "16 Jul 2026",
    status: "Paid",
    amount: "$2,263.17",
  },
  {
    id: "2",
    number: "INV-2026-0002",
    customer: "Somali Development Agency",
    date: "04 Jul 2026",
    dueDate: "19 Jul 2026",
    status: "Pending",
    amount: "$2,476.34",
  },
  {
    id: "3",
    number: "INV-2026-0003",
    customer: "East Africa Supplies Ltd",
    date: "07 Jul 2026",
    dueDate: "22 Jul 2026",
    status: "Approved",
    amount: "$2,689.51",
  },
  {
    id: "4",
    number: "INV-2026-0004",
    customer: "Galmudug Education Office",
    date: "10 Jul 2026",
    dueDate: "25 Jul 2026",
    status: "Overdue",
    amount: "$2,902.68",
  },
  {
    id: "5",
    number: "INV-2026-0005",
    customer: "Jubba Logistics",
    date: "13 Jul 2026",
    dueDate: "28 Jul 2026",
    status: "Draft",
    amount: "$3,115.85",
  },
  {
    id: "6",
    number: "INV-2026-0006",
    customer: "Somtel Business",
    date: "16 Jul 2026",
    dueDate: "31 Jul 2026",
    status: "Partially paid",
    amount: "$3,329.02",
  },
  {
    id: "7",
    number: "INV-2026-0007",
    customer: "Mogadishu Medical Center",
    date: "19 Jul 2026",
    dueDate: "03 Aug 2026",
    status: "Paid",
    amount: "$3,542.19",
  },
  {
    id: "8",
    number: "INV-2026-0008",
    customer: "Puntland Agriculture Agency",
    date: "22 Jul 2026",
    dueDate: "06 Aug 2026",
    status: "Pending",
    amount: "$3,755.36",
  },
  {
    id: "9",
    number: "INV-2026-0009",
    customer: "Daryeel Construction",
    date: "25 Jul 2026",
    dueDate: "09 Aug 2026",
    status: "Approved",
    amount: "$3,968.53",
  },
  {
    id: "10",
    number: "INV-2026-0010",
    customer: "Bilan Trading",
    date: "28 Jul 2026",
    dueDate: "12 Aug 2026",
    status: "Overdue",
    amount: "$4,181.70",
  },
  {
    id: "11",
    number: "INV-2026-0011",
    customer: "HornRise Group",
    date: "31 Jul 2026",
    dueDate: "15 Aug 2026",
    status: "Draft",
    amount: "$4,394.87",
  },
  {
    id: "12",
    number: "INV-2026-0012",
    customer: "Jubba Logistics",
    date: "03 Aug 2026",
    dueDate: "18 Aug 2026",
    status: "Paid",
    amount: "$4,608.04",
  },
  {
    id: "13",
    number: "INV-2026-0013",
    customer: "Somtel Business",
    date: "06 Aug 2026",
    dueDate: "21 Aug 2026",
    status: "Partially paid",
    amount: "$4,821.21",
  },
  {
    id: "14",
    number: "INV-2026-0014",
    customer: "Banadir Services",
    date: "08 Aug 2026",
    dueDate: "23 Aug 2026",
    status: "Pending",
    amount: "$5,034.38",
  },
];

export const mockQuotations: DemoQuotation[] = [
  {
    id: "1",
    number: "QT-2026-0001",
    customer: "HornRise Group",
    date: "01 Jul 2026",
    validUntil: "31 Jul 2026",
    status: "Approved",
    amount: "$1,850.00",
  },
  {
    id: "2",
    number: "QT-2026-0002",
    customer: "Somali Development Agency",
    date: "03 Jul 2026",
    validUntil: "02 Aug 2026",
    status: "Pending",
    amount: "$3,420.50",
  },
  {
    id: "3",
    number: "QT-2026-0003",
    customer: "East Africa Supplies Ltd",
    date: "06 Jul 2026",
    validUntil: "05 Aug 2026",
    status: "Draft",
    amount: "$980.00",
  },
  {
    id: "4",
    number: "QT-2026-0004",
    customer: "Galmudug Education Office",
    date: "09 Jul 2026",
    validUntil: "08 Aug 2026",
    status: "Pending",
    amount: "$5,100.25",
  },
  {
    id: "5",
    number: "QT-2026-0005",
    customer: "Jubba Logistics",
    date: "12 Jul 2026",
    validUntil: "11 Aug 2026",
    status: "Approved",
    amount: "$2,275.00",
  },
  {
    id: "6",
    number: "QT-2026-0006",
    customer: "Somtel Business",
    date: "15 Jul 2026",
    validUntil: "14 Aug 2026",
    status: "Draft",
    amount: "$4,660.80",
  },
  {
    id: "7",
    number: "QT-2026-0007",
    customer: "Mogadishu Medical Center",
    date: "18 Jul 2026",
    validUntil: "17 Aug 2026",
    status: "Approved",
    amount: "$7,890.00",
  },
  {
    id: "8",
    number: "QT-2026-0008",
    customer: "Puntland Agriculture Agency",
    date: "21 Jul 2026",
    validUntil: "20 Aug 2026",
    status: "Pending",
    amount: "$1,125.40",
  },
  {
    id: "9",
    number: "QT-2026-0009",
    customer: "Daryeel Construction",
    date: "24 Jul 2026",
    validUntil: "23 Aug 2026",
    status: "Draft",
    amount: "$9,450.00",
  },
  {
    id: "10",
    number: "QT-2026-0010",
    customer: "Bilan Trading",
    date: "27 Jul 2026",
    validUntil: "26 Aug 2026",
    status: "Approved",
    amount: "$2,040.75",
  },
  {
    id: "11",
    number: "QT-2026-0011",
    customer: "Nugaal Retail Co",
    date: "30 Jul 2026",
    validUntil: "29 Aug 2026",
    status: "Pending",
    amount: "$3,310.00",
  },
  {
    id: "12",
    number: "QT-2026-0012",
    customer: "Banadir Services",
    date: "02 Aug 2026",
    validUntil: "01 Sep 2026",
    status: "Draft",
    amount: "$1,560.20",
  },
];
