export interface DemoCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  created: string;
}

export interface DemoSaleLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface DemoSale {
  id: string;
  number: string;
  customer: string;
  date: string;
  validUntil: string;
  status: "Draft" | "Pending" | "Approved";
  amount: string;
  lines: DemoSaleLine[];
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
    phone: "615100037",
    status: "Active",
    created: "02 Jul 2026",
  },
  {
    id: "2",
    name: "Somali Development Agency",
    email: "accounts@sda.so",
    phone: "615100074",
    status: "Active",
    created: "05 Jul 2026",
  },
  {
    id: "3",
    name: "East Africa Supplies Ltd",
    email: "billing@eas.africa",
    phone: "615100111",
    status: "Inactive",
    created: "08 Jul 2026",
  },
  {
    id: "4",
    name: "Galmudug Education Office",
    email: "procurement@geo.so",
    phone: "615100148",
    status: "Active",
    created: "11 Jul 2026",
  },
  {
    id: "5",
    name: "Jubba Logistics",
    email: "ops@jubbalogistics.so",
    phone: "615100185",
    status: "Active",
    created: "14 Jul 2026",
  },
  {
    id: "6",
    name: "Somtel Business",
    email: "corp@somtel.so",
    phone: "615100222",
    status: "Inactive",
    created: "17 Jul 2026",
  },
  {
    id: "7",
    name: "Mogadishu Medical Center",
    email: "admin@mmc.so",
    phone: "615100259",
    status: "Active",
    created: "20 Jul 2026",
  },
  {
    id: "8",
    name: "Puntland Agriculture Agency",
    email: "finance@paa.so",
    phone: "615100296",
    status: "Active",
    created: "23 Jul 2026",
  },
  {
    id: "9",
    name: "Daryeel Construction",
    email: "projects@daryeel.so",
    phone: "615100333",
    status: "Inactive",
    created: "26 Jul 2026",
  },
  {
    id: "10",
    name: "Bilan Trading",
    email: "sales@bilan.so",
    phone: "615100370",
    status: "Active",
    created: "29 Jul 2026",
  },
  {
    id: "11",
    name: "Nugaal Retail Co",
    email: "info@nugaal.so",
    phone: "615100407",
    status: "Active",
    created: "01 Aug 2026",
  },
  {
    id: "12",
    name: "Banadir Services",
    email: "contact@banadir.so",
    phone: "615100444",
    status: "Inactive",
    created: "04 Aug 2026",
  },
  {
    id: "13",
    name: "Hiran Logistics",
    email: "hiran@hiran.so",
    phone: "615100481",
    status: "Active",
    created: "07 Aug 2026",
  },
  {
    id: "14",
    name: "Bay Development Agency",
    email: "finance@bda.so",
    phone: "615100518",
    status: "Active",
    created: "10 Aug 2026",
  },
  {
    id: "15",
    name: "Gedo Construction Ltd",
    email: "projects@gedo.so",
    phone: "615100555",
    status: "Active",
    created: "13 Aug 2026",
  },
  {
    id: "16",
    name: "HornRise Group",
    email: "finance@hornrise.so",
    phone: "615100037",
    status: "Active",
    created: "02 Jul 2026",
  },
  {
    id: "17",
    name: "Somali Development Agency",
    email: "accounts@sda.so",
    phone: "615100074",
    status: "Active",
    created: "05 Jul 2026",
  },
  {
    id: "18",
    name: "East Africa Supplies Ltd",
    email: "billing@eas.africa",
    phone: "615100111",
    status: "Inactive",
    created: "08 Jul 2026",
  },
  {
    id: "19",
    name: "Galmudug Education Office",
    email: "procurement@geo.so",
    phone: "615100148",
    status: "Active",
    created: "11 Jul 2026",
  },
  {
    id: "20",
    name: "Jubba Logistics",
    email: "ops@jubbalogistics.so",
    phone: "615100185",
    status: "Active",
    created: "14 Jul 2026",
  },
  {
    id: "21",
    name: "Somtel Business",
    email: "corp@somtel.so",
    phone: "615100222",
    status: "Inactive",
    created: "17 Jul 2026",
  },
  {
    id: "22",
    name: "Mogadishu Medical Center",
    email: "admin@mmc.so",
    phone: "615100259",
    status: "Active",
    created: "20 Jul 2026",
  },
  {
    id: "23",
    name: "Puntland Agriculture Agency",
    email: "finance@paa.so",
    phone: "615100296",
    status: "Active",
    created: "23 Jul 2026",
  },
  {
    id: "24",
    name: "Daryeel Construction",
    email: "projects@daryeel.so",
    phone: "615100333",
    status: "Inactive",
    created: "26 Jul 2026",
  },
  {
    id: "25",
    name: "Bilan Trading",
    email: "sales@bilan.so",
    phone: "615100370",
    status: "Active",
    created: "29 Jul 2026",
  },
  {
    id: "26",
    name: "Nugaal Retail Co",
    email: "info@nugaal.so",
    phone: "615100407",
    status: "Active",
    created: "01 Aug 2026",
  },
  {
    id: "27",
    name: "Banadir Services",
    email: "contact@banadir.so",
    phone: "615100444",
    status: "Inactive",
    created: "04 Aug 2026",
  },
  {
    id: "28",
    name: "Hiran Logistics",
    email: "hiran@hiran.so",
    phone: "615100481",
    status: "Active",
    created: "07 Aug 2026",
  },
  {
    id: "29",
    name: "Bay Development Agency",
    email: "finance@bda.so",
    phone: "615100518",
    status: "Active",
    created: "10 Aug 2026",
  },
  {
    id: "30",
    name: "Gedo Construction Ltd",
    email: "projects@gedo.so",
    phone: "615100555",
    status: "Active",
    created: "13 Aug 2026",
  },
];

export const mockSales: DemoSale[] = [
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
