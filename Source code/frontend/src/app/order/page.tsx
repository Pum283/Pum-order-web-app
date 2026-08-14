export default function OrderQrPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <h1 className="text-2xl font-semibold">Order QR (khách)</h1>
      <p className="mt-2 text-stone-600">
        Quét QR bàn → xem menu → gửi order (cần NV xác nhận) → gọi thêm / gọi NV / gọi thanh toán.
      </p>
      <p className="mt-4 text-sm text-amber-800">Route mẫu: /order?token={"{qrToken}"}</p>
    </main>
  );
}
