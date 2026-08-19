// Chuẩn ngày giờ dùng chung cho toàn bộ giao diện R2S LeadOps.
// Dữ liệu thời điểm vẫn lưu ISO/UTC để so sánh chính xác; chỉ việc nhập,
// hiển thị và các mốc "theo ngày" được cố định theo giờ Việt Nam.
export const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: VIETNAM_TIME_ZONE,
  dateStyle: "short",
  timeStyle: "short",
});

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: VIETNAM_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: VIETNAM_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function partsOf(value = new Date()) {
  const parts = partsFormatter.formatToParts(new Date(value));
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

/** Hiển thị ngày giờ cố định theo Việt Nam, bất kể múi giờ của máy người dùng. */
export function formatVietnamDateTime(value) {
  if (!value) return "";
  return dateTimeFormatter.format(new Date(value));
}

export function formatVietnamDate(value) {
  if (!value) return "";
  return dateFormatter.format(new Date(value));
}

/** Khóa ngày YYYY-MM-DD theo giờ Việt Nam, dùng cho cache và thống kê theo ngày. */
export function getVietnamDateKey(value = new Date()) {
  const { year, month, day } = partsOf(value);
  return `${year}-${month}-${day}`;
}

/** Chuyển thời điểm ISO sang giá trị dùng cho input date/time theo giờ Việt Nam. */
export function getVietnamDateTimeInput(value) {
  const { year, month, day, hour, minute } = partsOf(value);
  return { date: `${year}-${month}-${day}`, time: `${hour}:${minute}` };
}

/** Chuyển input date/time thành ISO, hiểu giờ người dùng nhập là giờ Việt Nam. */
export function vietnamDateTimeToIso(date, time = "00:00") {
  if (!date) return "";
  return new Date(`${date}T${time}:00+07:00`).toISOString();
}

/** Parse ngày không kèm giờ là đầu ngày tại Việt Nam, tránh bị Date hiểu là UTC. */
export function vietnamDateToDate(date) {
  if (!date) return null;
  return new Date(`${date}T00:00:00+07:00`);
}
