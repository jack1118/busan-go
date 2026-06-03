import { useState } from "react";
import type { Emergency, EmergencyContact, Hotel } from "../types";
import phrases from "../data/phrases.json";
import SpeakCard from "./SpeakCard";

const STORAGE_KEY = "busan:emergency";

interface Phrase {
  zh: string;
  kr: string;
  rr: string;
}
const SOS_PHRASES: Phrase[] =
  phrases.categories.find((c) => c.key === "sos")?.items ?? [];

interface MyInfo {
  insurancePolicy: string;
  insurancePhone: string;
  customContact: string;
}

const EMPTY_INFO: MyInfo = {
  insurancePolicy: "",
  insurancePhone: "",
  customContact: "",
};

function loadMyInfo(): MyInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_INFO;
    const parsed = JSON.parse(raw) as Partial<MyInfo>;
    return {
      insurancePolicy: parsed.insurancePolicy ?? "",
      insurancePhone: parsed.insurancePhone ?? "",
      customContact: parsed.customContact ?? "",
    };
  } catch {
    return EMPTY_INFO;
  }
}

function telHref(number: string): string {
  return `tel:${number.replace(/[^+\d]/g, "")}`;
}

export default function EmergencyCard({
  emergency,
  hotel,
}: {
  emergency: Emergency;
  hotel: Hotel | null;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const [myInfo, setMyInfo] = useState<MyInfo>(loadMyInfo);
  const [phrase, setPhrase] = useState<Phrase | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1500);
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      showToast("已複製！");
    } catch {
      showToast("複製失敗");
    }
  };

  const updateInfo = (patch: Partial<MyInfo>) => {
    setMyInfo((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* localStorage 不可用時略過 */
      }
      return next;
    });
  };

  const cardClass =
    "rounded-2xl bg-white p-4 shadow-sm shadow-black/[0.04] ring-1 ring-black/[0.03] dark:bg-neutral-800 dark:ring-white/5";
  const sectionTitleClass =
    "mb-3 text-[15px] font-bold text-neutral-800 dark:text-neutral-100";
  const callBtnClass =
    "flex items-center justify-center gap-1.5 rounded-2xl bg-coral px-4 py-2.5 text-[15px] font-semibold text-white active:scale-[0.98]";

  return (
    <div className="flex flex-col gap-3">
      {/* 1. 飯店 */}
      {hotel && (
        <section className={cardClass}>
          <h3 className={sectionTitleClass}>🏨 飯店</h3>
          <p className="text-[15px] font-semibold leading-snug">
            {hotel.name}
          </p>
          {hotel.nameKr && (
            <p className="mt-0.5 text-[13px] text-neutral-500 dark:text-neutral-400">
              {hotel.nameKr}
            </p>
          )}
          {hotel.address && (
            <p className="mt-2 text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              {hotel.address}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {hotel.address && (
              <button
                onClick={() => copyAddress(hotel.address)}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-neutral-100 px-4 py-2.5 text-[14px] font-semibold text-neutral-700 active:scale-[0.98] dark:bg-neutral-700 dark:text-neutral-200"
              >
                📋 複製地址
              </button>
            )}
            {hotel.phone && (
              <a href={telHref(hotel.phone)} className={callBtnClass}>
                📞 撥打飯店
              </a>
            )}
          </div>
        </section>
      )}

      {/* 2. 韓國緊急電話 */}
      <section className={cardClass}>
        <h3 className={sectionTitleClass}>🚨 韓國緊急電話</h3>
        <ContactList contacts={emergency.korea} callBtnClass={callBtnClass} />
      </section>

      {/* 2b. 緊急韓文求助句 */}
      {SOS_PHRASES.length > 0 && (
        <section className={cardClass}>
          <h3 className={sectionTitleClass}>💬 緊急韓文求助（點→放大給對方看）</h3>
          <ul className="flex flex-col gap-2">
            {SOS_PHRASES.map((p, i) => (
              <li key={i}>
                <button
                  onClick={() => setPhrase(p)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl bg-neutral-100 px-3 py-2.5 text-left active:scale-[0.99] dark:bg-neutral-700"
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] text-neutral-500 dark:text-neutral-400">
                      {p.zh}
                    </span>
                    <span className="block text-[15px] font-bold">{p.kr}</span>
                  </span>
                  <span className="shrink-0 text-[12px] font-semibold text-coral">
                    放大
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 3. 其他 */}
      <section className={cardClass}>
        <h3 className={sectionTitleClass}>☎️ 其他</h3>
        <ContactList contacts={emergency.others} callBtnClass={callBtnClass} />
      </section>

      {/* 4. 我的資訊 */}
      <section className={cardClass}>
        <h3 className={sectionTitleClass}>📝 我的資訊</h3>
        <div className="flex flex-col gap-3">
          <label className="block">
            <span className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
              旅遊保險保單號碼
            </span>
            <input
              type="text"
              value={myInfo.insurancePolicy}
              onChange={(e) => updateInfo({ insurancePolicy: e.target.value })}
              placeholder="例：BS-2026-000000"
              className="mt-1 w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-[15px] text-neutral-800 outline-none ring-1 ring-transparent focus:ring-busan-blue dark:bg-neutral-700 dark:text-neutral-100"
            />
          </label>

          <label className="block">
            <span className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
              保險公司電話
            </span>
            <input
              type="tel"
              value={myInfo.insurancePhone}
              onChange={(e) => updateInfo({ insurancePhone: e.target.value })}
              placeholder="例：+886 2 0000 0000"
              className="mt-1 w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-[15px] text-neutral-800 outline-none ring-1 ring-transparent focus:ring-busan-blue dark:bg-neutral-700 dark:text-neutral-100"
            />
            {myInfo.insurancePhone.trim() && (
              <a
                href={telHref(myInfo.insurancePhone)}
                className={`mt-2 ${callBtnClass}`}
              >
                📞 撥打 {myInfo.insurancePhone}
              </a>
            )}
          </label>

          <label className="block">
            <span className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
              自訂緊急聯絡人
            </span>
            <textarea
              value={myInfo.customContact}
              onChange={(e) => updateInfo({ customContact: e.target.value })}
              placeholder="姓名、關係、電話…"
              rows={3}
              className="mt-1 w-full resize-none rounded-xl bg-neutral-100 px-3 py-2.5 text-[15px] leading-relaxed text-neutral-800 outline-none ring-1 ring-transparent focus:ring-busan-blue dark:bg-neutral-700 dark:text-neutral-100"
            />
          </label>
        </div>
      </section>

      {phrase && (
        <SpeakCard
          open={!!phrase}
          zh={phrase.zh}
          kr={phrase.kr}
          rr={phrase.rr}
          onClose={() => setPhrase(null)}
        />
      )}

      {/* toast */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center">
          <span className="rounded-full bg-busan-blue-deep px-4 py-2 text-[14px] font-semibold text-white shadow-lg">
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}

function ContactList({
  contacts,
  callBtnClass,
}: {
  contacts: EmergencyContact[];
  callBtnClass: string;
}) {
  if (contacts.length === 0) {
    return (
      <p className="text-[14px] text-neutral-400 dark:text-neutral-500">
        無資料
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {contacts.map((c, i) => (
        <li
          key={i}
          className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0 dark:border-neutral-700"
        >
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-snug">{c.label}</p>
            {c.note && (
              <p className="mt-0.5 text-[13px] text-neutral-500 dark:text-neutral-400">
                {c.note}
              </p>
            )}
          </div>
          <a
            href={telHref(c.number)}
            className={`shrink-0 ${callBtnClass}`}
          >
            📞 撥打 {c.number}
          </a>
        </li>
      ))}
    </ul>
  );
}
