import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.DEV ? "http://localhost:3000" : "/api",
  withCredentials: true,
});

export interface User {
  userId: number;
  email: string;
  name: string;
}

export async function getMe(): Promise<User | null> {
  try {
    const { data } = await api.get("/me");
    return data;
  } catch {
    return null;
  }
}

export async function getCount(): Promise<number> {
  const { data } = await api.get("/counter");
  return data.count;
}

export async function getCooldown(): Promise<number> {
  const { data } = await api.get("/counter/cooldown");
  return data.remainingSeconds;
}

export async function increment(): Promise<{
  count: number;
  remainingSeconds: number;
}> {
  const { data } = await api.post("/counter/increment");
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}
