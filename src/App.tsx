import React from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clapperboard,
  Gamepad2,
  Heart,
  ListFilter,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';

type Category = '読書' | '漫画' | '映画' | 'ドラマ' | 'ゲーム';
type Feeling = 'よかった' | 'しんどい' | 'わくわく' | '泣いた' | '考えた' | '普通';
type Rating = 1 | 2 | 3;

type LogItem = {
  id: string;
  category: Category;
  title: string;
  amount: string;
  rating: Rating;
  feeling: Feeling;
  note: string;
  createdAt: string;
};

// 気持ち(feeling)はデータ構造に残したまま、入力フォームからだけ外している。
// 新規記録には既定値「普通」が入る。過去の記録の気持ちは編集してもそのまま保たれる。
type Draft = Omit<LogItem, 'id' | 'createdAt'>;

const categories: Category[] = ['読書', '漫画', '映画', 'ドラマ', 'ゲーム'];
const emptyDraft: Draft = {
  category: '読書',
  title: '',
  amount: '',
  rating: 3,
  feeling: '普通',
  note: '',
};
const storageKey = 'movie-book-labo-records';
const ratings: Rating[] = [1, 2, 3];

const categoryIcon = {
  読書: BookOpen,
  漫画: BookOpen,
  映画: Clapperboard,
  ドラマ: Heart,
  ゲーム: Gamepad2,
} satisfies Record<Category, typeof BookOpen>;

// 「どのくらい」の例示をカテゴリに合わせて出し分ける
const amountHint = {
  読書: '例: 20ページ',
  漫画: '例: 3話',
  映画: '例: 1本 / 30分だけ',
  ドラマ: '例: 2話',
  ゲーム: '例: 30分',
} satisfies Record<Category, string>;

function loadRecords(): LogItem[] {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return [];

  try {
    return (JSON.parse(saved) as LogItem[]).map((record) => ({
      ...record,
      rating: record.rating ?? 3,
      feeling: record.feeling ?? '普通',
    }));
  } catch {
    return [];
  }
}

function ratingLabel(rating: Rating) {
  return '★'.repeat(rating) + '☆'.repeat(3 - rating);
}

export function App() {
  const [records, setRecords] = React.useState<LogItem[]>(loadRecords);
  const [draft, setDraft] = React.useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [view, setView] = React.useState<'home' | 'input' | 'search'>('home');
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<Category | 'すべて'>('すべて');

  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records]);

  React.useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  const recentRecords = React.useMemo(
    () => records.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [records],
  );
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
    setDetailsOpen(false);
  }

  function startRecord(category: Category) {
    setDraft({ ...emptyDraft, category });
    setEditingId(null);
    setDetailsOpen(false);
    setView('input');
  }

  function goBackFromInput() {
    const wasEditing = Boolean(editingId);
    resetForm();
    setView(wasEditing ? 'search' : 'home');
  }

  function saveRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) return;

    if (editingId) {
      setRecords((current) =>
        current.map((record) => (record.id === editingId ? { ...record, ...draft, title } : record)),
      );
      resetForm();
      setNotice('変更を保存しました');
      setView('search');
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
      resetForm();
      setNotice('記録しました');
      setView('home');
    }
  }

  function editRecord(record: LogItem) {
    setDraft({
      category: record.category,
      title: record.title,
      amount: record.amount,
      rating: record.rating,
      feeling: record.feeling,
      note: record.note,
    });
    setEditingId(record.id);
    setDetailsOpen(Boolean(record.amount || record.note));
    setView('input');
  }

  function deleteRecord(id: string) {
    const target = records.find((record) => record.id === id);
    if (!target) return;
    const ok = window.confirm(`「${target.title}」を削除しますか？`);
    if (!ok) return;
    setRecords((current) => current.filter((record) => record.id !== id));
    if (editingId === id) resetForm();
  }

  const heading =
    view === 'home' ? '今日は何を楽しんだ？' : view === 'input' ? (editingId ? '記録を直す' : `${draft.category}の記録`) : '記録を探す';

  return (
    <main className="app-shell" aria-label="movie-book-labo">
      <section className="phone-screen">
        <header className="top-area">
          <p className="app-kicker">movie-book-labo</p>
          <h1>{heading}</h1>
          <p className="count-text" aria-live="polite">
            {notice || (records.length === 0 ? 'まだ記録はありません' : `${records.length}件の記録`)}
          </p>
        </header>

        {view === 'home' && (
          <section className="screen-stack" aria-label="カテゴリを選ぶ">
            <div className="choice-list">
              {categories.map((category) => {
                const Icon = categoryIcon[category];
                return (
                  <button className="choice-row" type="button" key={category} onClick={() => startRecord(category)}>
                    <span className="choice-icon"><Icon size={26} aria-hidden="true" /></span>
                    <span>{category}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {view === 'input' && (
          <form className="screen-stack" onSubmit={saveRecord}>
            <div className="action-stack">
              <button className="quiet-button" type="button" onClick={goBackFromInput}>
                <ChevronLeft size={26} aria-hidden="true" />
                もどる
              </button>
            </div>

            <label className="field">
              <span>作品名</span>
              <input
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="例: きのう何食べた？"
                autoComplete="off"
              />
            </label>

            <fieldset className="rating-field">
              <legend>星</legend>
              <div className="rating-buttons" aria-label="星評価">
                {ratings.map((rating) => (
                  <button
                    className={draft.rating === rating ? 'selected' : ''}
                    type="button"
                    key={rating}
                    onClick={() => setDraft((current) => ({ ...current, rating }))}
                    aria-pressed={draft.rating === rating}
                  >
                    <Star size={32} fill="currentColor" aria-hidden="true" />
                    {ratingLabel(rating)}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="action-stack">
              <button
                className="quiet-button"
                type="button"
                aria-expanded={detailsOpen}
                onClick={() => setDetailsOpen((open) => !open)}
              >
                {detailsOpen ? <ChevronUp size={26} aria-hidden="true" /> : <ChevronDown size={26} aria-hidden="true" />}
                くわしく書く（任意）
              </button>
            </div>

            {detailsOpen && (
              <>
                <label className="field">
                  <span>どのくらい</span>
                  <input
                    value={draft.amount}
                    onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
                    placeholder={amountHint[draft.category]}
                    autoComplete="off"
                  />
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
              </>
            )}

            <div className="action-stack">
              <button className="primary-button" type="submit">
                <Plus size={30} aria-hidden="true" />
                {editingId ? '変更を保存' : '記録する'}
              </button>
              {editingId && (
                <button className="quiet-button" type="button" onClick={goBackFromInput}>
                  <X size={26} aria-hidden="true" />
                  やめる
                </button>
              )}
            </div>
          </form>
        )}

        {view === 'search' && (
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
                          <p className="record-rating" aria-label={`星${record.rating}`}>{ratingLabel(record.rating)}</p>
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
          <button
            className={view !== 'search' ? 'active' : ''}
            type="button"
            onClick={() => {
              resetForm();
              setView('home');
            }}
          >
            <Plus size={30} aria-hidden="true" />
            記録
          </button>
          <button
            className={view === 'search' ? 'active' : ''}
            type="button"
            onClick={() => setView('search')}
          >
            <Search size={30} aria-hidden="true" />
            探す
          </button>
        </nav>
      </section>
      <aside className="landscape-lock">縦向きで使ってください</aside>
    </main>
  );
}
