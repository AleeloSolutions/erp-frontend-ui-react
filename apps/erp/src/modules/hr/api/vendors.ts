
import { demoVendors, type DemoVendor } from "../data/demo-data";
import { MockApiError, mockDelay } from "@/lib/mock";

export async function getVendors(): Promise<DemoVendor[]> {
  await mockDelay();
  return demoVendors;
}

export async function getVendor(id: string): Promise<DemoVendor> {
  await mockDelay();
  const vendor = demoVendors.find((vendor) => vendor.id === id);
  if (!vendor) {
    throw new MockApiError("Vendor not found");
  }
  return vendor;
}

export async function createVendor(vendor: DemoVendor): Promise<DemoVendor> {
  await mockDelay();
  demoVendors.push(vendor);
  return vendor;
}

export async function updateVendor(vendor: DemoVendor): Promise<DemoVendor> {
  await mockDelay();
  const index = demoVendors.findIndex((v) => v.id === vendor.id);
  if (index === -1) {
    throw new MockApiError("Vendor not found");
  }
  demoVendors[index] = vendor;
  return vendor;
}

export async function deleteVendor(id: string): Promise<void> {
  await mockDelay();
  const index = demoVendors.findIndex((v) => v.id === id);
  if (index === -1) {
    throw new MockApiError("Vendor not found");
  }
  demoVendors.splice(index, 1);
}