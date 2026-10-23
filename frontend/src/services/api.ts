const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface SensorReading {
  id: number;
  device_id: number;
  voltage: number | null;
  current: number | null;
  power: number | null;
  energy: number | null;
  power_factor: number | null;
  frequency: number | null;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  vibration: number | null;
  timestamp: string;
}

export interface Device {
  id: number;
  device_id: string;
  device_name: string;
  device_type: string;
  location: string;
  status: string;
  created_at: string;
}

export interface DeviceDetails extends Device {
  latest_reading: SensorReading | null;
}

// Retrieve all registered devices.
export async function getDevices(): Promise<Device[]> {
  const response = await fetch(`${API_BASE_URL}/devices/`);

  if (!response.ok) {
    throw new Error(`Could not load devices (${response.status})`);
  }

  return response.json() as Promise<Device[]>;
}

// Retrieve one device and its latest stored reading.
export async function getDeviceDetails(
  deviceId: number,
): Promise<DeviceDetails> {
  const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`);

  if (!response.ok) {
    throw new Error(
      `Could not load device ${deviceId} (${response.status})`,
    );
  }

  return response.json() as Promise<DeviceDetails>;
}