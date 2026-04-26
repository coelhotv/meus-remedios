export default function handler(req, res) {
  res.status(200).send(process.env.VITE_VAPID_PUBLIC_KEY)
}
