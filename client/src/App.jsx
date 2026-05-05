import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  KanbanSquare,
  LayoutDashboard,
  Loader2,
  LogOut,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X
} from 'lucide-react';
import { api } from './api.js';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

const STATUSES = [
  ['TODO', 'Todo'],
  ['IN_PROGRESS', 'In progress'],
  ['REVIEW', 'Review'],
  ['DONE', 'Done']
];

const PRIORITIES = [
  ['LOW', 'Low'],
  ['MEDIUM', 'Medium'],
  ['HIGH', 'High'],
  ['URGENT', 'Urgent']
];

const emptyTask = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'TODO',
  dueDate: '',
  assigneeId: ''
};

function AppGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="screen-center">
        <Loader2 className="spin" size={28} />
      </div>
    );
  }

  return user ? <Workspace /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}

function AuthScreen() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: 'admin@taskharbor.dev',
    password: 'Admin@1234'
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        await signup(form);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function useDemo(email, password) {
    setMode('login');
    setForm((current) => ({ ...current, email, password }));
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand-mark">
          <KanbanSquare size={24} />
        </div>
        <p className="eyebrow">Task Harbor</p>
        <h1>Team work, visible.</h1>
        <p className="auth-copy">
          Projects, assignments, overdue work, and member permissions in one focused workspace.
        </p>

        <div className="demo-strip">
          <button type="button" onClick={() => useDemo('admin@taskharbor.dev', 'Admin@1234')}>
            Admin demo
          </button>
          <button type="button" onClick={() => useDemo('maya@taskharbor.dev', 'Member@1234')}>
            Member demo
          </button>
        </div>
      </section>

      <section className="auth-card">
        <div className="segmented">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Login
          </button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
            Signup
          </button>
        </div>

        <form onSubmit={submit} className="form-stack">
          {mode === 'signup' && (
            <label>
              Name
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Your name"
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              type="email"
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              type="password"
              placeholder="Minimum 8 characters"
              required
            />
          </label>

          {error && <div className="error-note">{error}</div>}

          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />}
            {mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  );
}

function Workspace() {
  const { user, logout } = useAuth();
  const [view, setView] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projectModal, setProjectModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);

  async function loadData(preferredProjectId) {
    setError('');
    setLoading(true);

    try {
      const [dashboardData, projectData] = await Promise.all([
        api.dashboard(),
        api.listProjects()
      ]);
      const projectList = projectData.projects;
      const nextProjectId =
        preferredProjectId || selectedProject?.id || projectList.find(Boolean)?.id;

      setDashboard(dashboardData);
      setProjects(projectList);

      if (nextProjectId) {
        const [projectResponse, taskResponse] = await Promise.all([
          api.getProject(nextProjectId),
          api.listTasks(nextProjectId)
        ]);
        setSelectedProject(projectResponse.project);
        setTasks(taskResponse.tasks);
      } else {
        setSelectedProject(null);
        setTasks([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const isAdmin = selectedProject?.currentUserRole === 'ADMIN';

  async function selectProject(id) {
    setError('');
    setLoading(true);
    try {
      const [projectResponse, taskResponse] = await Promise.all([
        api.getProject(id),
        api.listTasks(id)
      ]);
      setSelectedProject(projectResponse.project);
      setTasks(taskResponse.tasks);
      setView('projects');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createProject(payload) {
    const response = await api.createProject(payload);
    setProjectModal(false);
    setView('projects');
    await loadData(response.project.id);
  }

  async function createTask(payload) {
    if (!selectedProject) return;
    await api.createTask(selectedProject.id, payload);
    setTaskModal(false);
    await loadData(selectedProject.id);
  }

  async function updateTaskStatus(task, status) {
    await api.updateTask(task.id, { status });
    await loadData(selectedProject.id);
  }

  async function deleteTask(task) {
    const confirmed = window.confirm(`Delete "${task.title}"?`);
    if (!confirmed) return;
    await api.deleteTask(task.id);
    await loadData(selectedProject.id);
  }

  async function addMember(payload) {
    await api.addMember(selectedProject.id, payload);
    await loadData(selectedProject.id);
  }

  async function updateMember(memberId, role) {
    await api.updateMember(selectedProject.id, memberId, { role });
    await loadData(selectedProject.id);
  }

  async function removeMember(member) {
    const confirmed = window.confirm(`Remove ${member.user.name} from this project?`);
    if (!confirmed) return;
    await api.removeMember(selectedProject.id, member.id);
    await loadData(selectedProject.id);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small">
            <KanbanSquare size={21} />
          </div>
          <div>
            <strong>Task Harbor</strong>
            <span>Team task manager</span>
          </div>
        </div>

        <nav className="nav-stack">
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button className={view === 'projects' ? 'active' : ''} onClick={() => setView('projects')}>
            <FolderKanban size={18} />
            Projects
          </button>
        </nav>

        <div className="project-switcher">
          <div className="switcher-title">
            <span>Projects</span>
            <button title="New project" aria-label="New project" onClick={() => setProjectModal(true)}>
              <Plus size={16} />
            </button>
          </div>
          {projects.map((project) => (
            <button
              key={project.id}
              className={selectedProject?.id === project.id ? 'project-pill active' : 'project-pill'}
              onClick={() => selectProject(project.id)}
            >
              <span>{project.name}</span>
              <small>{project.currentUserRole.toLowerCase()}</small>
            </button>
          ))}
          {!projects.length && <p className="muted-small">No projects yet.</p>}
        </div>

        <div className="user-box">
          <div className="avatar">{initials(user.name)}</div>
          <div>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <button title="Logout" aria-label="Logout" onClick={logout}>
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <main className="workspace-main">
        {error && <div className="error-note top-error">{error}</div>}
        {loading && (
          <div className="loading-bar">
            <Loader2 className="spin" size={18} />
            Syncing workspace
          </div>
        )}

        {view === 'dashboard' && (
          <Dashboard dashboard={dashboard} onOpenProject={selectProject} onNewProject={() => setProjectModal(true)} />
        )}

        {view === 'projects' && (
          <ProjectWorkspace
            project={selectedProject}
            tasks={tasks}
            isAdmin={isAdmin}
            user={user}
            onNewProject={() => setProjectModal(true)}
            onNewTask={() => setTaskModal(true)}
            onStatusChange={updateTaskStatus}
            onDeleteTask={deleteTask}
            onAddMember={addMember}
            onUpdateMember={updateMember}
            onRemoveMember={removeMember}
          />
        )}
      </main>

      {projectModal && (
        <ProjectModal onClose={() => setProjectModal(false)} onSubmit={createProject} />
      )}
      {taskModal && selectedProject && (
        <TaskModal
          members={selectedProject.members}
          onClose={() => setTaskModal(false)}
          onSubmit={createTask}
        />
      )}
    </div>
  );
}

function Dashboard({ dashboard, onOpenProject, onNewProject }) {
  const stats = dashboard?.stats || {};
  const completion = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <section className="content-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Current workload</h1>
        </div>
        <button className="primary-button compact" onClick={onNewProject}>
          <Plus size={18} />
          New project
        </button>
      </header>

      <div className="metric-grid">
        <Metric icon={FolderKanban} label="Projects" value={dashboard?.projectCount || 0} />
        <Metric icon={ClipboardList} label="Tasks" value={stats.total || 0} />
        <Metric icon={CheckCircle2} label="Done" value={`${completion}%`} />
        <Metric icon={AlertTriangle} label="Overdue" value={stats.overdue || 0} tone="danger" />
      </div>

      <div className="dashboard-grid">
        <section className="panel wide">
          <div className="panel-heading">
            <h2>Project health</h2>
          </div>
          <div className="health-list">
            {(dashboard?.projectHealth || []).map((project) => {
              const done = project.stats.total
                ? Math.round((project.stats.done / project.stats.total) * 100)
                : 0;
              return (
                <button key={project.id} className="health-row" onClick={() => onOpenProject(project.id)}>
                  <div>
                    <strong>{project.name}</strong>
                    <span>
                      {project.memberCount} members · {project.role.toLowerCase()}
                    </span>
                  </div>
                  <div className="progress-track" aria-label={`${done}% complete`}>
                    <span style={{ width: `${done}%` }} />
                  </div>
                  <b>{done}%</b>
                </button>
              );
            })}
            {!dashboard?.projectHealth?.length && <EmptyState text="Create your first project to start tracking work." />}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Assigned to me</h2>
          </div>
          <TaskList tasks={dashboard?.myTasks || []} compact />
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Overdue</h2>
          </div>
          <TaskList tasks={dashboard?.overdueTasks || []} compact emptyText="No overdue assigned tasks." />
        </section>
      </div>
    </section>
  );
}

function ProjectWorkspace({
  project,
  tasks,
  isAdmin,
  user,
  onNewProject,
  onNewTask,
  onStatusChange,
  onDeleteTask,
  onAddMember,
  onUpdateMember,
  onRemoveMember
}) {
  const [tab, setTab] = useState('board');

  useEffect(() => {
    setTab('board');
  }, [project?.id]);

  if (!project) {
    return (
      <section className="content-stack">
        <header className="page-header">
          <div>
            <p className="eyebrow">Projects</p>
            <h1>No project selected</h1>
          </div>
          <button className="primary-button compact" onClick={onNewProject}>
            <Plus size={18} />
            New project
          </button>
        </header>
      </section>
    );
  }

  return (
    <section className="content-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">{project.currentUserRole.toLowerCase()} access</p>
          <h1>{project.name}</h1>
          <p className="page-subtitle">{project.description}</p>
        </div>
        {isAdmin && (
          <button className="primary-button compact" onClick={onNewTask}>
            <Plus size={18} />
            New task
          </button>
        )}
      </header>

      <div className="project-summary">
        <MiniStat label="Todo" value={project.stats.todo} />
        <MiniStat label="In progress" value={project.stats.inProgress} />
        <MiniStat label="Review" value={project.stats.review} />
        <MiniStat label="Done" value={project.stats.done} />
        <MiniStat label="Overdue" value={project.stats.overdue} danger />
      </div>

      <div className="tabs">
        <button className={tab === 'board' ? 'active' : ''} onClick={() => setTab('board')}>
          <ClipboardList size={17} />
          Board
        </button>
        <button className={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}>
          <Users size={17} />
          Team
        </button>
      </div>

      {tab === 'board' ? (
        <TaskBoard
          tasks={tasks}
          isAdmin={isAdmin}
          user={user}
          onStatusChange={onStatusChange}
          onDeleteTask={onDeleteTask}
        />
      ) : (
        <TeamPanel
          project={project}
          isAdmin={isAdmin}
          onAddMember={onAddMember}
          onUpdateMember={onUpdateMember}
          onRemoveMember={onRemoveMember}
        />
      )}
    </section>
  );
}

function TaskBoard({ tasks, isAdmin, user, onStatusChange, onDeleteTask }) {
  const grouped = useMemo(() => {
    return STATUSES.reduce((acc, [status]) => {
      acc[status] = tasks.filter((task) => task.status === status);
      return acc;
    }, {});
  }, [tasks]);

  return (
    <div className="board">
      {STATUSES.map(([status, label]) => (
        <section className="board-column" key={status}>
          <div className="column-heading">
            <h2>{label}</h2>
            <span>{grouped[status].length}</span>
          </div>
          <div className="task-stack">
            {grouped[status].map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isAdmin={isAdmin}
                canUpdate={isAdmin || task.assignee?.id === user.id}
                onStatusChange={onStatusChange}
                onDeleteTask={onDeleteTask}
              />
            ))}
            {!grouped[status].length && <div className="empty-column">No tasks</div>}
          </div>
        </section>
      ))}
    </div>
  );
}

function TaskCard({ task, isAdmin, canUpdate, onStatusChange, onDeleteTask }) {
  return (
    <article className={task.overdue ? 'task-card overdue' : 'task-card'}>
      <div className="task-topline">
        <span className={`priority ${task.priority.toLowerCase()}`}>{priorityLabel(task.priority)}</span>
        {task.overdue && (
          <span className="overdue-chip">
            <AlertTriangle size={13} />
            Overdue
          </span>
        )}
      </div>
      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}
      <div className="task-meta">
        <span>
          <UserRound size={14} />
          {task.assignee?.name || 'Unassigned'}
        </span>
        <span>
          <CalendarClock size={14} />
          {formatDate(task.dueDate)}
        </span>
      </div>
      <div className="task-actions">
        <select
          value={task.status}
          disabled={!canUpdate}
          onChange={(event) => onStatusChange(task, event.target.value)}
        >
          {STATUSES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {isAdmin && (
          <button title="Delete task" aria-label="Delete task" onClick={() => onDeleteTask(task)}>
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </article>
  );
}

function TeamPanel({ project, isAdmin, onAddMember, onUpdateMember, onRemoveMember }) {
  const [form, setForm] = useState({ email: '', role: 'MEMBER' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onAddMember(form);
      setForm({ email: '', role: 'MEMBER' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="team-layout">
      <section className="panel">
        <div className="panel-heading">
          <h2>Members</h2>
        </div>
        <div className="member-list">
          {project.members.map((member) => (
            <div className="member-row" key={member.id}>
              <div className="avatar">{initials(member.user.name)}</div>
              <div className="member-main">
                <strong>{member.user.name}</strong>
                <span>{member.user.email}</span>
              </div>
              <select
                value={member.role}
                disabled={!isAdmin}
                onChange={(event) => onUpdateMember(member.id, event.target.value)}
              >
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
              </select>
              {isAdmin && (
                <button title="Remove member" aria-label="Remove member" onClick={() => onRemoveMember(member)}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {isAdmin && (
        <section className="panel add-member-panel">
          <div className="panel-heading">
            <h2>Add teammate</h2>
          </div>
          <form className="form-stack" onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="teammate@example.com"
                required
              />
            </label>
            <label>
              Role
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
            {error && <div className="error-note">{error}</div>}
            <button className="primary-button compact" type="submit" disabled={busy}>
              {busy ? <Loader2 className="spin" size={18} /> : <Plus size={18} />}
              Add member
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

function ProjectModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', description: '', deadline: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="New project" onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <label>
          Name
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Customer migration"
            required
          />
        </label>
        <label>
          Description
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="What this project is responsible for"
            rows="4"
          />
        </label>
        <label>
          Deadline
          <input
            type="date"
            value={form.deadline}
            onChange={(event) => setForm({ ...form, deadline: event.target.value })}
          />
        </label>
        {error && <div className="error-note">{error}</div>}
        <button className="primary-button" disabled={busy}>
          {busy ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
          Create project
        </button>
      </form>
    </Modal>
  );
}

function TaskModal({ members, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyTask);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="New task" onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <label>
          Title
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Prepare release checklist"
            required
          />
        </label>
        <label>
          Description
          <textarea
            rows="4"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Notes, acceptance criteria, or links"
          />
        </label>
        <div className="form-grid">
          <label>
            Priority
            <select
              value={form.priority}
              onChange={(event) => setForm({ ...form, priority: event.target.value })}
            >
              {PRIORITIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              {STATUSES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>
            Due date
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            />
          </label>
          <label>
            Assignee
            <select
              value={form.assigneeId}
              onChange={(event) => setForm({ ...form, assigneeId: event.target.value })}
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <div className="error-note">{error}</div>}
        <button className="primary-button" disabled={busy}>
          {busy ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
          Create task
        </button>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-heading">
          <h2>{title}</h2>
          <button title="Close" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone }) {
  return (
    <div className={tone === 'danger' ? 'metric danger' : 'metric'}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MiniStat({ label, value, danger }) {
  return (
    <div className={danger ? 'mini-stat danger' : 'mini-stat'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TaskList({ tasks, compact, emptyText = 'No tasks assigned.' }) {
  if (!tasks.length) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className={compact ? 'task-list compact' : 'task-list'}>
      {tasks.map((task) => (
        <div className="task-list-row" key={task.id}>
          <span className={`status-dot ${task.status.toLowerCase()}`} />
          <div>
            <strong>{task.title}</strong>
            <span>
              {task.project?.name || 'Project'} · {formatDate(task.dueDate)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}

function initials(name = '') {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value) {
  if (!value) return 'No due date';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric'
  }).format(new Date(value));
}

function priorityLabel(value) {
  return PRIORITIES.find(([key]) => key === value)?.[1] || value;
}
