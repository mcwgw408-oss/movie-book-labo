import React from 'react';
import ReactDOM from 'react-dom/client';
import { BookOpen, Clapperboard, Gamepad2, Heart, ListFilter, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import './styles.css';

type Category = '読書' | '漫画' | '映画' | 'ドラマ' | 'ゲーム';
type Feeling = 'よかった' | 'しんどい' | 'わくわく' | '泣いた' | '考えた' | '普通';

type LogItem = {
  id: string;
  category: Category;
  title: string;
  amount: string;
  feeling: Feeling;
  note: string;
  createdAt: string;
};

type Draft = Omit<LogItem, 'id' | 'createdAt'>;

const categories: Category[] = ['読書', '漫画', '映画', 'ドラマ', 'ゲーム'];
const feelings: Feeling[] = ['よかった', 'しんどい', 'わくわく', '泣いた', '考えた', '普通'];
const emptyDraft: Draft = {
  category: '読書',
  title: '',
  amount: '',
  feeling: 'よかった',
  note: '',
};
const storageKey = 'movie-book-labo-records';

const categoryIcon = {
  読書: BookOpen,
  漫画: BookOpen,
  映画: Clapperboard,
  ドラマ: Heart,
  ゲーム: Gamepad2,
} satisfies Record<Category, typeof BookOpen>;

function loadRecords(): LogItem[] {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return [];

  try {
    return JSON.parse(saved) as LogItem[];
  } catch {
    return [];
  }
}

function App() {
  const [records, setRecords] = React.useState<LogItem[]>(loadRecords);
  const [draft, setDraft] = React.useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [view, setView] = React.useState<'record' | 'search'>('record');
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<Category | 'すべて'>('すべて');

  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records]);

  const recentRecords = React.useMemo(() => records.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [records]);
  const filteredRecords = React.useMemo(() => {
    const text = query.trim().toLowerCase();
    return recentRecords.filter((record) => {
      const matchesCategory = filter === 'すべて' || record.category === filter;
      const matchesText = !text || `${record.title} ${record.note} ${record.amount}`.toLowerCase().includes(text);
      return matchesCategory && matchesText;
    });
  }, [filter, query, recentRecords]);

  function resetForm() {
    setDraft(emptyDraft);
    setEditingId(null);
  }

  function saveRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) return;

    if (editingId) {
      setRecords((current) =>
        current.map((record) => (record.id === editingId ? { ...record, ...draft, title } : record)),
      );
    } else {
      setRecords((current) => [
        {
          ...draft,
          id: crypto.randomUUID(),
          title,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
    }

    resetForm();
    setView('search');
  }

  function editRecord(record: LogItem) {
    setDraft({
      category: record.category,
      title: record.title,
      amount: record.amount,
      feeling: record.feeling,
      note: record.note,
    });
    setEditingId(record.id);
    setView('record');
  }

  function deleteRecord(id: string) {
    const target = records.find((record) => record.id === id);
    if (!target) return;
    const ok = window.confirm(`「${target.title}」を削除しますか？`);
    if (!ok) return;
    setRecords((current) => current.filter((record) => record.id !== id));
    if (editingId === id) resetForm();
  }

  return (
    <main className="app-shell" aria-label="movie-book-labo">
      <section className="phone-screen">
        <header className="top-area">
          <p className="app-kicker">movie-book-labo</p>
          <h1>{view === 'record' ? (editingId ? '記録を直す' : '今日の記録') : '記録を探す'}</h1>
          <p className="count-text">{records.length === 0 ? 'まだ記録はありません' : `${records.length}件の記録`}</p>
        </header>

        {view === 'record' ? (
          <form className="screen-stack" onSubmit={saveRecord}>
            <fieldset className="choice-list">
              <legend>カテゴリ</legend>
              {categories.map((category) => {
                const Icon = categoryIcon[category];
                return (
                  <label className="choice-row" key={category}>
                    <input
                      type="radio"
                      name="category"
                      value={category}
                      checked={draft.category === category}
                      onChange={() => setDraft((current) => ({ ...current, category }))}
                    />
                    <span className="choice-icon"><Icon size={26} aria-hidden="true" /></span>
                    <span>{category}</span>
                  </label>
                );
              })}
            </fieldset>

            <label className="field">
              <span>作品名</span>
              <input
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="例: きのう何食べた？"
                autoComplete="off"
              />
            </label>

            <label className="field">
              <span>どのくらい</span>
              <input
                value={draft.amount}
                onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
                placeholder="例: 30分 / 2話 / 20ページ"
                autoComplete="off"
              />
            </label>

            <label className="field">
              <span>気持ち</span>
              <select
                value={draft.feeling}
                onChange={(event) => setDraft((current) => ({ ...current, feeling: event.target.value as Feeling }))}
              >
                {feelings.map((feeling) => (
                  <option key={feeling} value={feeling}>{feeling}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>気づき</span>
              <textarea
                value={draft.note}
                onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
                placeholder="一言だけで大丈夫"
                rows={4}
              />
            </label>

            <div className="action-stack">
              <button className="primary-button" type="submit">
                <Plus size={30} aria-hidden="true" />
                {editingId ? '変更を保存' : '記録する'}
              </button>
              {editingId && (
                <button className="quiet-button" type="button" onClick={resetForm}>
                  <X size={26} aria-hidden="true" />
                  やめる
                </button>
              )}
            </div>
          </form>
        ) : (
          <section className="screen-stack" aria-label="検索">
            <label className="field">
              <span>検索</span>
              <div className="search-box">
                <Search size={26} aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="作品名・気づきで探す"
                />
              </div>
            </label>

            <label className="field">
              <span>カテゴリ</span>
              <div className="select-wrap">
                <ListFilter size={26} aria-hidden="true" />
                <select value={filter} onChange={(event) => setFilter(event.target.value as Category | 'すべて')}>
                  <option value="すべて">すべて</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </label>

            <div className="record-list">
              {filteredRecords.length === 0 ? (
                <p className="empty-text">見つかりませんでした</p>
              ) : (
                filteredRecords.map((record) => {
                  const Icon = categoryIcon[record.category];
                  return (
                    <article className="record-card" key={record.id}>
                      <div className="record-main">
                        <span className="record-icon"><Icon size={28} aria-hidden="true" /></span>
                        <div>
                          <p className="record-category">{record.category}・{record.feeling}</p>
                          <h2>{record.title}</h2>
                          {record.amount && <p className="record-amount">{record.amount}</p>}
                          {record.note && <p className="record-note">{record.note}</p>}
                          <time>{new Date(record.createdAt).toLocaleDateString('ja-JP')}</time>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button type="button" onClick={() => editRecord(record)} aria-label={`${record.title}を編集`}>
                          <Pencil size={28} aria-hidden="true" />
                          編集
                        </button>
                        <button type="button" onClick={() => deleteRecord(record.id)} aria-label={`${record.title}を削除`}>
                          <Trash2 size={28} aria-hidden="true" />
                          削除
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        )}

        <nav className="bottom-nav" aria-label="画面切り替え">
          <button className={view === 'record' ? 'active' : ''} type="button" onClick={() => setView('record')}>
            <Plus size={30} aria-hidden="true" />
            記録
          </button>
          <button className={view === 'search' ? 'active' : ''} type="button" onClick={() => setView('search')}>
            <Search size={30} aria-hidden="true" />
            探す
          </button>
        </nav>
      </section>
      <aside className="landscape-lock">縦向きで使ってください</aside>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
