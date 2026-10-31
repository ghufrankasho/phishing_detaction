export const VERDICT_LABEL = {
  safe: "آمن",

  phishing: "احتيال",
};

export const KIND_LABEL = {
  email: "بريد إلكتروني",
  message: "رسالة",
  url: "رابط / نطاق",
};

// Where each kind's list page lives (used for "back" links)
export const KIND_PATH = {
  email: "/emails",
  message: "/messages",
  url: "/domains",
};

export function formatDate(iso) {
  return new Date(iso).toLocaleString("ar-u-nu-latn", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
