export interface DemoCustomer {
  id: string;
  name: string;
  email: string;
  test: string;
  phone: string;
  status: "Active" | "Inactive";
  created: string;
}

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface DemoInvoice {
  id: string;
  number: string;
  customer: string;
  date: string;
  dueDate: string;
  /** Document workflow state — drives the Odoo-style statusbar (Draft ❯ Posted). */
  status: "Draft" | "Posted";
  /** Payment state — shown as its own badge, same as Odoo's separate payment_state field. */
  paymentStatus: "Not Paid" | "Partially Paid" | "Paid" | "Overdue";
  amount: string;
  lines: InvoiceLine[];
}

export interface QuotationLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface DemoQuotation {
  id: string;
  number: string;
  customer: string;
  date: string;
  validUntil: string;
  status: "Draft" | "Pending" | "Approved";
  amount: string;
  lines: QuotationLine[];
}

export interface DemoContract {
  id: string;
  name: string;
  customer: string;
  startDate: string;
  endDate: string;
  value: string;
  status: "Active" | "Draft" | "Expired";
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
    status: "Posted",
    paymentStatus: "Paid",
    amount: "$2,263.17",
    lines: [
      { id: "1-l1", description: "Consulting services", quantity: 1, unitPrice: 2263.17 },
    ],
  },
  {
    id: "2",
    number: "INV-2026-0002",
    customer: "Somali Development Agency",
    date: "04 Jul 2026",
    dueDate: "19 Jul 2026",
    status: "Posted",
    paymentStatus: "Not Paid",
    amount: "$2,476.34",
    lines: [
      {
        id: "2-l1",
        description: "Software subscription",
        quantity: 1,
        unitPrice: 2476.34,
      },
    ],
  },
  {
    id: "3",
    number: "INV-2026-0003",
    customer: "East Africa Supplies Ltd",
    date: "07 Jul 2026",
    dueDate: "22 Jul 2026",
    status: "Posted",
    paymentStatus: "Partially Paid",
    amount: "$2,689.51",
    lines: [
      { id: "3-l1", description: "Equipment rental", quantity: 1, unitPrice: 2689.51 },
    ],
  },
  {
    id: "4",
    number: "INV-2026-0004",
    customer: "Galmudug Education Office",
    date: "10 Jul 2026",
    dueDate: "25 Jul 2026",
    status: "Posted",
    paymentStatus: "Overdue",
    amount: "$2,902.68",
    lines: [
      { id: "4-l1", description: "Training workshop", quantity: 1, unitPrice: 2902.68 },
    ],
  },
  {
    id: "5",
    number: "INV-2026-0005",
    customer: "Jubba Logistics",
    date: "13 Jul 2026",
    dueDate: "28 Jul 2026",
    status: "Draft",
    paymentStatus: "Not Paid",
    amount: "$3,115.85",
    lines: [
      { id: "5-l1", description: "Logistics services", quantity: 1, unitPrice: 3115.85 },
    ],
  },
  {
    id: "6",
    number: "INV-2026-0006",
    customer: "Somtel Business",
    date: "16 Jul 2026",
    dueDate: "31 Jul 2026",
    status: "Posted",
    paymentStatus: "Partially Paid",
    amount: "$3,329.02",
    lines: [
      {
        id: "6-l1",
        description: "Maintenance contract",
        quantity: 1,
        unitPrice: 3329.02,
      },
    ],
  },
  {
    id: "7",
    number: "INV-2026-0007",
    customer: "Mogadishu Medical Center",
    date: "19 Jul 2026",
    dueDate: "03 Aug 2026",
    status: "Posted",
    paymentStatus: "Paid",
    amount: "$3,542.19",
    lines: [
      { id: "7-l1", description: "Custom development", quantity: 1, unitPrice: 3542.19 },
    ],
  },
  {
    id: "8",
    number: "INV-2026-0008",
    customer: "Puntland Agriculture Agency",
    date: "22 Jul 2026",
    dueDate: "06 Aug 2026",
    status: "Posted",
    paymentStatus: "Not Paid",
    amount: "$3,755.36",
    lines: [
      { id: "8-l1", description: "Advisory services", quantity: 1, unitPrice: 3755.36 },
    ],
  },
  {
    id: "9",
    number: "INV-2026-0009",
    customer: "Daryeel Construction",
    date: "25 Jul 2026",
    dueDate: "09 Aug 2026",
    status: "Posted",
    paymentStatus: "Overdue",
    amount: "$3,968.53",
    lines: [
      { id: "9-l1", description: "Site inspection", quantity: 1, unitPrice: 3968.53 },
    ],
  },
  {
    id: "10",
    number: "INV-2026-0010",
    customer: "Bilan Trading",
    date: "28 Jul 2026",
    dueDate: "12 Aug 2026",
    status: "Draft",
    paymentStatus: "Not Paid",
    amount: "$4,181.70",
    lines: [
      { id: "10-l1", description: "Retail supplies", quantity: 1, unitPrice: 4181.7 },
    ],
  },
  {
    id: "11",
    number: "INV-2026-0011",
    customer: "HornRise Group",
    date: "31 Jul 2026",
    dueDate: "15 Aug 2026",
    status: "Posted",
    paymentStatus: "Paid",
    amount: "$4,394.87",
    lines: [
      {
        id: "11-l1",
        description: "Consulting services",
        quantity: 1,
        unitPrice: 4394.87,
      },
    ],
  },
  {
    id: "12",
    number: "INV-2026-0012",
    customer: "Jubba Logistics",
    date: "03 Aug 2026",
    dueDate: "18 Aug 2026",
    status: "Posted",
    paymentStatus: "Paid",
    amount: "$4,608.04",
    lines: [
      { id: "12-l1", description: "Fleet servicing", quantity: 1, unitPrice: 4608.04 },
    ],
  },
  {
    id: "13",
    number: "INV-2026-0013",
    customer: "Somtel Business",
    date: "06 Aug 2026",
    dueDate: "21 Aug 2026",
    status: "Posted",
    paymentStatus: "Partially Paid",
    amount: "$4,821.21",
    lines: [{ id: "13-l1", description: "Spare parts", quantity: 1, unitPrice: 4821.21 }],
  },
  {
    id: "14",
    number: "INV-2026-0014",
    customer: "Banadir Services",
    date: "08 Aug 2026",
    dueDate: "23 Aug 2026",
    status: "Posted",
    paymentStatus: "Not Paid",
    amount: "$5,034.38",
    lines: [
      { id: "14-l1", description: "Admin services", quantity: 1, unitPrice: 5034.38 },
    ],
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
    lines: [
      { id: "1-l1", description: "Consulting services", quantity: 1, unitPrice: 1850 },
    ],
  },
  {
    id: "2",
    number: "QT-2026-0002",
    customer: "Somali Development Agency",
    date: "03 Jul 2026",
    validUntil: "02 Aug 2026",
    status: "Pending",
    amount: "$3,420.50",
    lines: [
      { id: "2-l1", description: "Software license", quantity: 2, unitPrice: 1500 },
      { id: "2-l2", description: "Onboarding support", quantity: 1, unitPrice: 420.5 },
    ],
  },
  {
    id: "3",
    number: "QT-2026-0003",
    customer: "East Africa Supplies Ltd",
    date: "06 Jul 2026",
    validUntil: "05 Aug 2026",
    status: "Draft",
    amount: "$980.00",
    lines: [{ id: "3-l1", description: "Site survey", quantity: 1, unitPrice: 980 }],
  },
  {
    id: "4",
    number: "QT-2026-0004",
    customer: "Galmudug Education Office",
    date: "09 Jul 2026",
    validUntil: "08 Aug 2026",
    status: "Pending",
    amount: "$5,100.25",
    lines: [
      { id: "4-l1", description: "Equipment rental", quantity: 5, unitPrice: 1000 },
      { id: "4-l2", description: "Delivery fee", quantity: 1, unitPrice: 100.25 },
    ],
  },
  {
    id: "5",
    number: "QT-2026-0005",
    customer: "Jubba Logistics",
    date: "12 Jul 2026",
    validUntil: "11 Aug 2026",
    status: "Approved",
    amount: "$2,275.00",
    lines: [
      { id: "5-l1", description: "Training workshop", quantity: 1, unitPrice: 2275 },
    ],
  },
  {
    id: "6",
    number: "QT-2026-0006",
    customer: "Somtel Business",
    date: "15 Jul 2026",
    validUntil: "14 Aug 2026",
    status: "Draft",
    amount: "$4,660.80",
    lines: [
      { id: "6-l1", description: "Maintenance contract", quantity: 4, unitPrice: 1000 },
      { id: "6-l2", description: "Spare parts", quantity: 1, unitPrice: 660.8 },
    ],
  },
  {
    id: "7",
    number: "QT-2026-0007",
    customer: "Mogadishu Medical Center",
    date: "18 Jul 2026",
    validUntil: "17 Aug 2026",
    status: "Approved",
    amount: "$7,890.00",
    lines: [
      { id: "7-l1", description: "Custom development", quantity: 1, unitPrice: 7890 },
    ],
  },
  {
    id: "8",
    number: "QT-2026-0008",
    customer: "Puntland Agriculture Agency",
    date: "21 Jul 2026",
    validUntil: "20 Aug 2026",
    status: "Pending",
    amount: "$1,125.40",
    lines: [
      { id: "8-l1", description: "Consulting hours", quantity: 10, unitPrice: 112.54 },
    ],
  },
  {
    id: "9",
    number: "QT-2026-0009",
    customer: "Daryeel Construction",
    date: "24 Jul 2026",
    validUntil: "23 Aug 2026",
    status: "Draft",
    amount: "$9,450.00",
    lines: [
      { id: "9-l1", description: "Fleet servicing", quantity: 9, unitPrice: 1000 },
      { id: "9-l2", description: "Inspection fee", quantity: 1, unitPrice: 450 },
    ],
  },
  {
    id: "10",
    number: "QT-2026-0010",
    customer: "Bilan Trading",
    date: "27 Jul 2026",
    validUntil: "26 Aug 2026",
    status: "Approved",
    amount: "$2,040.75",
    lines: [
      {
        id: "10-l1",
        description: "Software subscription",
        quantity: 1,
        unitPrice: 2040.75,
      },
    ],
  },
  {
    id: "11",
    number: "QT-2026-0011",
    customer: "Nugaal Retail Co",
    date: "30 Jul 2026",
    validUntil: "29 Aug 2026",
    status: "Pending",
    amount: "$3,310.00",
    lines: [
      { id: "11-l1", description: "Logistics services", quantity: 1, unitPrice: 3310 },
    ],
  },
  {
    id: "12",
    number: "QT-2026-0012",
    customer: "Banadir Services",
    date: "02 Aug 2026",
    validUntil: "01 Sep 2026",
    status: "Draft",
    amount: "$1,560.20",
    lines: [
      { id: "12-l1", description: "Admin services", quantity: 2, unitPrice: 780.1 },
    ],
  },
];

export const mockContracts: DemoContract[] = [
  {
    id: "1",
    name: "HornRise Annual Support",
    customer: "HornRise Group",
    startDate: "01 Jan 2026",
    endDate: "31 Dec 2026",
    value: "$24,000.00",
    status: "Active",
  },
  {
    id: "2",
    name: "SDA Maintenance Agreement",
    customer: "Somali Development Agency",
    startDate: "15 Feb 2026",
    endDate: "14 Feb 2027",
    value: "$18,500.00",
    status: "Active",
  },
  {
    id: "3",
    name: "East Africa Supplies Framework",
    customer: "East Africa Supplies Ltd",
    startDate: "01 Mar 2026",
    endDate: "28 Feb 2027",
    value: "$12,750.00",
    status: "Draft",
  },
  {
    id: "4",
    name: "Galmudug Education Retainer",
    customer: "Galmudug Education Office",
    startDate: "01 Apr 2025",
    endDate: "31 Mar 2026",
    value: "$9,200.00",
    status: "Expired",
  },
  {
    id: "5",
    name: "Jubba Logistics SLA",
    customer: "Jubba Logistics",
    startDate: "01 May 2026",
    endDate: "30 Apr 2027",
    value: "$31,000.00",
    status: "Active",
  },
  {
    id: "6",
    name: "Somtel Business Services",
    customer: "Somtel Business",
    startDate: "01 Jun 2025",
    endDate: "31 May 2026",
    value: "$7,400.00",
    status: "Expired",
  },
  {
    id: "7",
    name: "Mogadishu Medical Support Plan",
    customer: "Mogadishu Medical Center",
    startDate: "01 Jul 2026",
    endDate: "30 Jun 2027",
    value: "$45,600.00",
    status: "Active",
  },
  {
    id: "8",
    name: "Puntland Agriculture Advisory",
    customer: "Puntland Agriculture Agency",
    startDate: "01 Aug 2026",
    endDate: "31 Jul 2027",
    value: "$15,300.00",
    status: "Draft",
  },
];
