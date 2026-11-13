import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  BriefcaseBusiness, Search, MapPin, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight,
  LogOut, LayoutDashboard, UserRound, ClipboardList, ArrowUpRight, Clock3, SlidersHorizontal,
  Building2, RefreshCw, X, CheckCircle2, Eye, Trash2
} from 'lucide-react';
import api, { getErrorMessage } from './api';
import { useAuth } from './auth';

const money = (min, max) => {
  if (!min && !max) return 'Not disclosed';
  const fmt = (value) => value >= 100000 ? `₹${(value / 100000).toFixed(value % 100000 ? 1 : 0)} LPA` : `₹${value.toLocaleString('en-IN')}`;
  return min && max ? `${fmt(min)} – ${fmt(max)}` : fmt(min || max);
};
const dateText = (date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const titleCase = (value) => value?.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 3200);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  return <div className={`toast ${type}`} role="status">{type === 'success' ? <CheckCircle2 size={18}/> : <X size={18}/>} {message}</div>;
}

function Protected({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="center-state">Checking your session…</div>;
  return token ? children : <Navigate to="/login" replace />;
}

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return <header className="topbar"><div className="nav-inner">
    <Link to="/" className="brand"><span className="brand-mark"><BriefcaseBusiness size={20}/></span>Jobby<span className="brand-dot">.</span></Link>
    <nav>
      <NavLink to="/">Find jobs</NavLink>
      {user && <NavLink to="/saved">Saved jobs</NavLink>}
      {user && <NavLink to="/applications">Applications</NavLink>}
      {user && <NavLink to="/dashboard">Dashboard</NavLink>}
    </nav>
    <div className="nav-user">{user ? <><span className="avatar">{user.name?.[0]?.toUpperCase()}</span><span className="user-name">{user.name}</span><button className="icon-btn" title="Logout" onClick={() => { logout(); navigate('/login'); }}><LogOut size={18}/></button></> : <><Link className="text-link" to="/login">Log in</Link><Link className="btn btn-small" to="/register">Create account</Link></>}</div>
  </div></header>;
}

function JobCard({ job, saved, onSave }) {
  return <article className="job-card">
    <div className="job-card-top"><div className="company-icon"><Building2 size={23}/></div><div className="job-heading"><Link to={`/jobs/${job.id}`} className="job-title">{job.title}</Link><div className="company-name">{job.company} <span className="rating">★ {job.rating ?? '—'}</span></div></div>
      <button className={`save-btn ${saved ? 'saved' : ''}`} onClick={() => onSave(job.id)} aria-label={saved ? 'Remove saved job' : 'Save job'}>{saved ? <BookmarkCheck size={20}/> : <Bookmark size={20}/>}</button>
    </div>
    <div className="job-meta"><span><MapPin size={15}/>{job.location}</span><span><BriefcaseBusiness size={15}/>{titleCase(job.employmentType)}</span><span><Clock3 size={15}/>{job.experience || 'Any experience'}</span></div>
    <p className="job-description">{job.description}</p>
    <div className="skills">{job.skills?.slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}</div>
    <div className="job-card-bottom"><strong>{money(job.salaryMin, job.salaryMax)}</strong><Link className="details-link" to={`/jobs/${job.id}`}>View details <ArrowUpRight size={16}/></Link></div>
  </article>;
}

function Home() {
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [location, setLocation] = useState(params.get('location') || '');
  const [type, setType] = useState(params.get('employmentType') || '');
  const [minSalary, setMinSalary] = useState(params.get('minSalary') || '');
  const [sortBy, setSortBy] = useState(params.get('sortBy') || 'newest');
  const [page, setPage] = useState(Number(params.get('page') || 1));
  const [result, setResult] = useState({ jobs: [], pagination: { total: 0, totalPages: 0 } });
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!token) { setSavedIds([]); return; }
    api.get('/saved-jobs').then(({ data }) => setSavedIds(data.jobs.map((job) => job.id))).catch(() => {});
  }, [token]);

  const loadJobs = useCallback(async () => {
    setLoading(true); setError('');
    const query = Object.fromEntries([...params.entries()]);
    try {
      const { data } = await api.get('/jobs', { params: { ...query, page, limit: 8, sortBy } });
      setResult(data);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [params, page, sortBy]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const applyFilters = (event) => {
    event?.preventDefault();
    const next = {};
    if (search.trim()) next.search = search.trim();
    if (location.trim()) next.location = location.trim();
    if (type) next.employmentType = type;
    if (minSalary) next.minSalary = minSalary;
    if (sortBy !== 'newest') next.sortBy = sortBy;
    setPage(1); next.page = '1'; setParams(next);
  };

  const toggleSave = async (jobId) => {
    if (!token) { setToast('Log in to save jobs.'); return; }
    const isSaved = savedIds.includes(jobId);
    try {
      if (isSaved) await api.delete(`/saved-jobs/${jobId}`);
      else await api.post(`/saved-jobs/${jobId}`);
      setSavedIds((ids) => isSaved ? ids.filter((id) => id !== jobId) : [...ids, jobId]);
      setToast(isSaved ? 'Job removed from saved jobs.' : 'Job saved to your account.');
    } catch (err) { setToast(getErrorMessage(err)); }
  };

  const clearFilters = () => {
    setSearch(''); setLocation(''); setType(''); setMinSalary(''); setSortBy('newest'); setPage(1); setParams({});
  };

  return <><section className="hero"><div className="hero-inner"><div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div><h1>Find work that<br/><span>moves you forward.</span></h1><p>Discover opportunities, organize your search and take control of your career journey.</p>
    <form className="search-panel" onSubmit={applyFilters}><label><Search size={19}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Job title, company or skill"/></label><label><MapPin size={19}/><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or remote"/></label><button className="btn" type="submit">Search jobs <Search size={17}/></button></form>
    <div className="hero-foot"><span><CheckCircle2 size={15}/> Curated sample opportunities</span><span><CheckCircle2 size={15}/> Track applications in one place</span></div>
  </div></section>
  <main className="page-wrap">
    <div className="section-head"><div><div className="eyebrow dark">OPPORTUNITIES</div><h2>Explore open positions</h2><p className="muted">Use filters to narrow down roles that match your goals.</p></div><div className="result-count">{result.pagination.total} jobs found</div></div>
    <div className="content-layout"><aside className="filters"><div className="filter-title"><SlidersHorizontal size={18}/> Filters <button onClick={clearFilters}>Clear</button></div>
      <label className="field-label">Employment type<select value={type} onChange={(e) => { setType(e.target.value); }}><option value="">All types</option><option value="FULL_TIME">Full time</option><option value="PART_TIME">Part time</option><option value="INTERNSHIP">Internship</option><option value="CONTRACT">Contract</option><option value="FREELANCE">Freelance</option></select></label>
      <label className="field-label">Minimum annual salary<select value={minSalary} onChange={(e) => setMinSalary(e.target.value)}><option value="">Any salary</option><option value="3">₹3 LPA+</option><option value="5">₹5 LPA+</option><option value="8">₹8 LPA+</option><option value="10">₹10 LPA+</option></select></label>
      <label className="field-label">Sort by<select value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="newest">Most recent</option><option value="salary">Salary</option><option value="rating">Company rating</option></select></label>
      <button className="btn filter-apply" onClick={applyFilters}>Apply filters</button>
    </aside>
    <section className="job-results">
      {loading ? <div className="loading-grid">{[1,2,3,4].map((n) => <div className="skeleton" key={n}/>)}</div> : error ? <div className="state-card"><p>{error}</p><button className="btn" onClick={loadJobs}><RefreshCw size={16}/> Retry</button></div> : result.jobs.length === 0 ? <div className="state-card"><Search size={30}/><h3>No matching jobs</h3><p>Try changing your search or filters.</p><button className="btn btn-outline" onClick={clearFilters}>Clear filters</button></div> :
      <>{result.jobs.map((job) => <JobCard key={job.id} job={job} saved={savedIds.includes(job.id)} onSave={toggleSave}/>)}
      {result.pagination.totalPages > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); setParams((old) => ({ ...Object.fromEntries(old), page: String(p) })); }}><ChevronLeft size={17}/> Previous</button><span>Page {page} of {result.pagination.totalPages}</span><button disabled={page >= result.pagination.totalPages} onClick={() => { const p = page + 1; setPage(p); setParams((old) => ({ ...Object.fromEntries(old), page: String(p) })); }}>Next <ChevronRight size={17}/></button></div>}</>}
    </section></div>
  </main><Toast message={toast} onClose={() => setToast('')}/></>;
}

function AuthPage({ mode }) {
  const { login, register, token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (token) return <Navigate to="/dashboard" replace />;
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (mode === 'login') await login({ email: form.email, password: form.password });
      else await register(form);
      navigate('/dashboard');
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  };
  return <main className="auth-page"><form className="auth-card" onSubmit={submit}>
    <Link to="/" className="brand"><span className="brand-mark"><BriefcaseBusiness size={20}/></span>Jobby<span className="brand-dot">.</span></Link>
    <div className="eyebrow dark">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</div><h1>{mode === 'login' ? 'Sign in to Jobby' : 'Create your account'}</h1><p className="muted">{mode === 'login' ? 'Continue organizing your job search.' : 'Save opportunities and manage your applications.'}</p>
    {mode === 'register' && <label className="field-label">Full name<input required minLength="2" maxLength="60" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name"/></label>}
    <label className="field-label">Email address<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com"/></label>
    <label className="field-label">Password<input type="password" required minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters"/></label>
    {error && <div className="error-text">{error}</div>}
    <button className="btn auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
    {mode === 'login' && <div className="demo-hint">Demo: demo@jobby.dev · Demo@123</div>}
    <p className="auth-switch">{mode === 'login' ? "Don't have an account?" : 'Already registered?'} <Link to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Create one' : 'Sign in'}</Link></p>
  </form></main>;
}

function JobDetails() {
  const { id } = useParams();
  const { token } = useAuth();
  const [job, setJob] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.get(`/jobs/${id}`).then(({ data }) => setJob(data.job)).catch((err) => setError(getErrorMessage(err)));
    if (token) {
      api.post(`/activity/recent/${id}`).catch(() => {});
      api.get('/saved-jobs').then(({ data }) => setSaved(data.jobs.some((item) => item.id === id))).catch(() => {});
    }
  }, [id, token]);
  const save = async () => {
    if (!token) { setToast('Log in to save this job.'); return; }
    try {
      if (saved) await api.delete(`/saved-jobs/${id}`); else await api.post(`/saved-jobs/${id}`);
      setSaved(!saved); setToast(saved ? 'Removed from saved jobs.' : 'Job saved.');
    } catch (err) { setToast(getErrorMessage(err)); }
  };
  const apply = async () => {
    if (!token) { setToast('Log in to track this application.'); return; }
    setBusy(true);
    try { await api.post('/applications', { jobId: id }); setToast('Job added to your application tracker.'); }
    catch (err) { setToast(getErrorMessage(err)); }
    finally { setBusy(false); }
  };
  if (error) return <main className="page-wrap"><div className="state-card">{error}<Link to="/" className="btn">Back to jobs</Link></div></main>;
  if (!job) return <div className="center-state">Loading job details…</div>;
  return <main className="page-wrap detail-page"><Link to="/" className="back-link"><ChevronLeft size={17}/> Back to jobs</Link>
    <section className="detail-card"><div className="detail-top"><div className="company-icon large"><Building2 size={30}/></div><div><h1>{job.title}</h1><p>{job.company} · {job.location}</p></div></div>
      <div className="detail-meta"><span>{titleCase(job.employmentType)}</span><span>{job.experience || 'Experience not specified'}</span><span>★ {job.rating ?? '—'} rating</span></div>
      <div className="salary-large">{money(job.salaryMin, job.salaryMax)} <small>per year / as listed</small></div>
      <div className="detail-actions"><button className="btn" onClick={apply} disabled={busy}>{busy ? 'Adding…' : 'Track application'}</button><button className="btn btn-outline" onClick={save}>{saved ? <BookmarkCheck size={17}/> : <Bookmark size={17}/>} {saved ? 'Saved' : 'Save job'}</button>{job.companyWebsite && <a className="btn btn-outline" href={job.companyWebsite} target="_blank" rel="noreferrer">Company site <ArrowUpRight size={16}/></a>}</div>
      <div className="detail-section"><h2>About the role</h2><p>{job.description}</p></div>
      <div className="detail-section"><h2>Required skills</h2><div className="skills">{job.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div>
      <div className="detail-section"><h2>What we're looking for</h2><ul>{job.requirements.map((item) => <li key={item}>{item}</li>)}</ul></div>
    </section><Toast message={toast} onClose={() => setToast('')}/>
  </main>;
}

function SavedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setLoading(true); api.get('/saved-jobs').then(({ data }) => setJobs(data.jobs)).catch((e) => setError(getErrorMessage(e))).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);
  const remove = async (id) => { try { await api.delete(`/saved-jobs/${id}`); setJobs((old) => old.filter((job) => job.id !== id)); } catch (e) { setError(getErrorMessage(e)); } };
  return <main className="page-wrap subpage"><div className="section-head"><div><div className="eyebrow dark">YOUR COLLECTION</div><h2>Saved jobs</h2><p className="muted">Opportunities you've bookmarked for later.</p></div><span className="result-count">{jobs.length} saved</span></div>
    {loading ? <div className="skeleton"/> : error ? <div className="state-card">{error}<button className="btn" onClick={load}>Retry</button></div> : jobs.length ? <div className="job-list">{jobs.map((job) => <div key={job.id} className="saved-row"><JobCard job={job} saved onSave={remove}/></div>)}</div> : <div className="state-card"><Bookmark size={30}/><h3>No saved jobs yet</h3><p>Save roles that you'd like to revisit.</p><Link className="btn" to="/">Explore jobs</Link></div>}
  </main>;
}

function Applications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setLoading(true); api.get('/applications').then(({ data }) => setItems(data.applications)).catch((e) => setError(getErrorMessage(e))).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);
  const updateStatus = async (id, status) => {
    try { const { data } = await api.patch(`/applications/${id}`, { status }); setItems((old) => old.map((item) => item.id === id ? data.application : item)); }
    catch (e) { setError(getErrorMessage(e)); }
  };
  const remove = async (id) => {
    try { await api.delete(`/applications/${id}`); setItems((old) => old.filter((item) => item.id !== id)); }
    catch (e) { setError(getErrorMessage(e)); }
  };
  return <main className="page-wrap subpage"><div className="section-head"><div><div className="eyebrow dark">CAREER ORGANIZER</div><h2>Application tracker</h2><p className="muted">Keep every opportunity and its progress organized.</p></div><span className="result-count">{items.length} tracked</span></div>
    {error && <div className="error-banner">{error}</div>}
    {loading ? <div className="skeleton"/> : items.length ? <div className="table-wrap"><table><thead><tr><th>Role</th><th>Company</th><th>Applied</th><th>Status</th><th></th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><Link to={`/jobs/${item.job.id}`} className="table-job">{item.job.title}</Link></td><td>{item.job.company}</td><td>{dateText(item.appliedAt)}</td><td><select className="status-select" value={item.status} onChange={(e) => updateStatus(item.id, e.target.value)}>{['APPLIED','INTERVIEWING','OFFERED','REJECTED','WITHDRAWN'].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</select></td><td><button className="icon-btn danger" onClick={() => remove(item.id)} aria-label="Delete application"><Trash2 size={17}/></button></td></tr>)}</tbody></table></div> : <div className="state-card"><ClipboardList size={30}/><h3>No applications tracked</h3><p>Open a job and choose “Track application” to get started.</p><Link className="btn" to="/">Find jobs</Link></div>}
  </main>;
}

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const [dashboard, activity] = await Promise.all([api.get('/dashboard'), api.get('/activity/recent')]);
      setData(dashboard.data); setRecent(activity.data.jobs);
    } catch (e) { setError(getErrorMessage(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return <main className="page-wrap subpage"><div className="dashboard-welcome"><div><div className="eyebrow dark">YOUR WORKSPACE</div><h2>Welcome back, {user?.name?.split(' ')[0]}.</h2><p className="muted">A clear view of your job search progress.</p></div><div className="avatar big">{user?.name?.[0]?.toUpperCase()}</div></div>
    {error && <div className="error-banner">{error}</div>}
    <div className="stats-grid">{[['Applications',data?.stats.applicationCount ?? '—',ClipboardList],['Saved jobs',data?.stats.savedCount ?? '—',Bookmark],['Interviews',data?.stats.interviewCount ?? '—',CheckCircle2],['Offers',data?.stats.offerCount ?? '—',BriefcaseBusiness]].map(([label,value,Icon]) => <div className="stat-card" key={label}><span className="stat-icon"><Icon size={20}/></span><span className="stat-value">{value}</span><span className="stat-label">{label}</span></div>)}</div>
    <div className="section-head compact"><div><h2>Recently viewed</h2><p className="muted">Roles you've opened recently.</p></div></div>
    {recent.length ? <div className="recent-grid">{recent.map((job) => <Link to={`/jobs/${job.id}`} className="recent-card" key={job.id}><Building2 size={20}/><strong>{job.title}</strong><span>{job.company} · {job.location}</span></Link>)}</div> : <div className="state-card small-state"><Eye size={24}/><p>Your recently viewed jobs will appear here.</p></div>}
  </main>;
}

function NotFound() {
  return <main className="page-wrap"><div className="state-card"><h2>Page not found</h2><p>The page you're looking for doesn't exist.</p><Link className="btn" to="/">Go to jobs</Link></div></main>;
}

export default function App() {
  return <><Header/><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/login" element={<AuthPage mode="login"/>}/>
    <Route path="/register" element={<AuthPage mode="register"/>}/>
    <Route path="/jobs/:id" element={<JobDetails/>}/>
    <Route path="/saved" element={<Protected><SavedJobs/></Protected>}/>
    <Route path="/applications" element={<Protected><Applications/></Protected>}/>
    <Route path="/dashboard" element={<Protected><Dashboard/></Protected>}/>
    <Route path="*" element={<NotFound/>}/>
  </Routes><footer className="footer"><span>© {new Date().getFullYear()} Jobby</span><span>Built with React · Express · PostgreSQL</span></footer></>;
}
