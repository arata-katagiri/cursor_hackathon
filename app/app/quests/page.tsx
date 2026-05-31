// BroQuest — all quests overview (incoming + outgoing)
import { requireProfile } from "@/lib/auth";
import { getIncomingQuests, getOutgoingQuests } from "@/lib/queries";
import { catById } from "@/components/broquest/data";
import CompleteButton from "@/components/broquest/CompleteButton";
import type { QuestStatus } from "@/lib/db/types";

const STATUS_LABEL: Record<QuestStatus, string> = {
  assigned: "New",
  in_progress: "In progress",
  submitted: "Submitted",
  completed: "Completed ✓",
  expired: "Expired",
};

function StatusChip({ status }: { status: QuestStatus }) {
  const done = status === "completed";
  return (
    <span
      className="gtag"
      style={{ background: done ? "var(--primary)" : "var(--tile)", color: done ? "var(--primary-ink)" : "var(--muted)" }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export default async function QuestsPage() {
  const profile = await requireProfile();
  const [incoming, outgoing] = await Promise.all([
    getIncomingQuests(profile.id),
    getOutgoingQuests(profile.id),
  ]);

  return (
    <div>
      <div className="screen-title">Quests</div>
      <div className="screen-sub">Everything you owe and everything you dared.</div>

      <div className="section-h"><h2>Incoming</h2><span className="count">{incoming.length}</span></div>
      {incoming.length === 0 && <div className="empty">No incoming quests.</div>}
      {incoming.map(({ quest, other }) => (
        <div className="quest" key={quest.id}>
          <div className="q-top">
            <div className="q-icon">{catById(quest.category).em}</div>
            <div className="q-meta">
              <div className="q-from">from <b>{other.display_name}</b></div>
              <div className="q-text">{quest.description || quest.title}</div>
            </div>
            <div className="q-reward"><span className="c">+{quest.reward_coins}</span>coins</div>
          </div>
          <div className="q-foot">
            <StatusChip status={quest.status} />
            {quest.status !== "completed" && quest.status !== "expired" && (
              <span style={{ marginLeft: "auto" }}><CompleteButton questId={quest.id} /></span>
            )}
          </div>
        </div>
      ))}

      <div className="section-h"><h2>Outgoing</h2><span className="count">{outgoing.length}</span></div>
      {outgoing.length === 0 && <div className="empty">You haven&apos;t dared anyone yet.</div>}
      {outgoing.map(({ quest, other }) => (
        <div className="quest" key={quest.id}>
          <div className="q-top">
            <div className="q-icon">{catById(quest.category).em}</div>
            <div className="q-meta">
              <div className="q-from">to <b>{other.display_name}</b></div>
              <div className="q-text">{quest.description || quest.title}</div>
            </div>
            <div className="q-reward"><span className="c">+{quest.reward_coins}</span>coins</div>
          </div>
          <div className="q-foot">
            <StatusChip status={quest.status} />
            {quest.status === "submitted" && (
              <span style={{ marginLeft: "auto" }}><CompleteButton questId={quest.id} label="Confirm ✓" /></span>
            )}
          </div>
        </div>
      ))}
      <div style={{ height: 8 }} />
    </div>
  );
}
