export interface DemoVendor {
    id: string;
    name: string;
    email: string;
    address: string;
    phone: string;
    status: "Active" | "Inactive";
    created: string;
  }
  
  export const demoVendors: DemoVendor[] = [
    {
      id: "1",
      name: "Vendor 1",
      email: "vendor1@example.com",
      address: "123 Main St, Anytown, USA",
      phone: "1234567890",
      status: "Active",
      created: "2021-01-01",
    },
    {
      id: "2",
      name: "Vendor 2",
      email: "vendor2@example.com",
      address: "456 Main St, Anytown, USA",
      phone: "1234567890",
      status: "Inactive",
      created: "2021-01-02",
    },
    {
      id: "3",
      name: "Vendor 3",
      email: "vendor3@example.com",
      address: "789 Main St, Anytown, USA",
      phone: "1234567890",
      status: "Active",
      created: "2021-01-03",
    },
    {
      id: "4",
      name: "Vendor 4",
      email: "vendor4@example.com",
      address: "101 Main St, Anytown, USA",
      phone: "1234567890",
      status: "Inactive",
      created: "2021-01-04",
    },
    {
      id: "5",
      name: "Vendor 5",
      email: "vendor5@example.com",
      address: "123 Main St, Anytown, USA",
      phone: "1234567890",
      status: "Active",
      created: "2021-01-05",
    },
    {
      id: "6",
      name: "Vendor 6",
      email: "vendor6@example.com",
      address: "456 Main St, Anytown, USA",
      phone: "1234567890",
      status: "Inactive",
      created: "2021-01-06",
    },
    {
      id: "7",
      name: "Vendor 7",
      email: "vendor7@example.com",
      address: "789 Main St, Anytown, USA",
      phone: "1234567890",
      status: "Active",
      created: "2021-01-07",
    },
    {
      id: "8",
      name: "Vendor 8",
      email: "vendor8@example.com",
      address: "101 Main St, Anytown, USA",
      phone: "1234567890",
      status: "Inactive",
      created: "2021-01-08",
    },
  ];