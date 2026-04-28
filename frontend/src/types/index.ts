export interface SensorReading {
  id?: number;
  temp: number;
  hr: number;
  spo2: number;
  timestamp?: string;
}

export interface Patient {
  name: string;
  mobile: string;
  gender?: string;
  dob?: string;
  blood_group?: string;
  address?: string;
  latest_reading?: SensorReading | null;
}

export interface ConfirmOpts {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}
