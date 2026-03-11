import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

if (!process.env.MP_ACCESS_TOKEN) {
  throw new Error("MP_ACCESS_TOKEN no configurado");
}

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export const preferenceClient = new Preference(mpClient);
export const paymentClient = new Payment(mpClient);
