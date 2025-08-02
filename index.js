import { useState, useEffect } from 'react';

// Toast组件，用于在页面右上角显示提示信息
const Toast = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // 3秒后自动关闭

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } bg-gray-800 text-white`}
    >
      <p>{message}</p>
    </div>
  );
};

// 主应用组件，管理页面状态和渲染不同组件
function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [submissionId, setSubmissionId] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const BACKEND_URL = 'https://hackerapi.mr-onion-blog.fun/api';

  // 反调试功能：检测开发者工具是否打开
  useEffect(() => {
    const checkDevTools = () => {
      const isDevToolsOpen = window.outerWidth - window.innerWidth > 100 || window.outerHeight - window.innerHeight > 100;
      if (isDevToolsOpen) {
        setToast({ message: '警告: 检测到开发者工具已打开！', isVisible: true });
        (function() {
          debugger;
        })();
      }
    };
    const interval = setInterval(checkDevTools, 500);

    return () => clearInterval(interval);
  }, []);

  // 禁用 F12, Ctrl+Shift+I 和右键菜单，并增加 Ctrl+Shift+L
  useEffect(() => {
    const handleKeydown = (e) => {
      // 禁用 F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        setToast({ message: 'F12 已被禁用。', isVisible: true });
      }
      // 禁用 Ctrl+Shift+I
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        setToast({ message: 'Ctrl+Shift+I 已被禁用。', isVisible: true });
      }
      // Ctrl+Shift+L 进入管理员登录
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        setCurrentPage('admin-login');
        setToast({ message: '进入管理员登录页面。', isVisible: true });
      }
    };

    const handleRightClick = (e) => {
      e.preventDefault();
      setToast({ message: '右键菜单已禁用。', isVisible: true });
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('contextmenu', handleRightClick);

    // 检查localStorage中是否有sessionKey
    const storedSessionKey = localStorage.getItem('sessionKey');
    if (storedSessionKey) {
        setIsAdminAuthenticated(true);
    }

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('contextmenu', handleRightClick);
    };
  }, []);

  const navigateTo = (page) => {
    setCurrentPage(page);
    setSubmissionStatus(null);
  };

  const handleSubmit = async (url, data) => {
    try {
      const response = await fetch(`${BACKEND_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('提交失败，请重试');
      }

      const result = await response.json();
      setSubmissionId(result.id);
      setSubmissionStatus('success');
      setCurrentPage('status-result');

    } catch (error) {
      console.error('提交错误:', error);
      setSubmissionStatus('error');
      setCurrentPage('status-result');
    }
  };

  const handleStatusQuery = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/status/${id}`);

      if (!response.ok) {
        throw new Error('查询失败，申请ID不存在');
      }

      const result = await response.json();
      setSubmissionStatus('query-success');
      setSubmissionId(result.id);
      setSubmissionData(result); 
      setCurrentPage('status-result');
    } catch (error) {
      console.error('查询错误:', error);
      setSubmissionStatus('query-error');
      setCurrentPage('status-result');
    }
  };

  const handleAdminLogin = async (password) => {
    try {
      const response = await fetch(`${BACKEND_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error('登录失败，密码错误');
      }

      const result = await response.json();
      localStorage.setItem('sessionKey', result.sessionKey);
      setIsAdminAuthenticated(true);
      setToast({ message: '管理员登录成功！', isVisible: true });
      setCurrentPage('admin-dashboard');

    } catch (error) {
      console.error('登录错误:', error);
      setToast({ message: '登录失败，请检查密码。', isVisible: true });
    }
  };
  
  const handleAdminLogout = () => {
    localStorage.removeItem('sessionKey');
    setIsAdminAuthenticated(false);
    setToast({ message: '已退出管理员账号。', isVisible: true });
    setCurrentPage('home');
  };
  
  const [submissionData, setSubmissionData] = useState(null);

  return (
    <div className="bg-blue-100 min-h-screen font-sans flex items-center justify-center p-4">
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-2xl p-8 space-y-6">
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">公开赛审核平台</h1>
          <p className="text-gray-500 mt-2">请选择你要进行的操作</p>
        </header>

        <nav className="flex justify-center space-x-4 md:space-x-8">
          <button
            onClick={() => navigateTo('quiz-apply')}
            className={`px-4 py-2 rounded-full transition-colors duration-300 font-medium ${
              currentPage === 'quiz-apply' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            答题申请
          </button>
          <button
            onClick={() => navigateTo('comp-apply')}
            className={`px-4 py-2 rounded-full transition-colors duration-300 font-medium ${
              currentPage === 'comp-apply' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            比赛申请
          </button>
          <button
            onClick={() => navigateTo('status-query')}
            className={`px-4 py-2 rounded-full transition-colors duration-300 font-medium ${
              currentPage === 'status-query' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            状态查询
          </button>
          {isAdminAuthenticated && (
            <button
              onClick={() => setCurrentPage('admin-dashboard')}
              className={`px-4 py-2 rounded-full transition-colors duration-300 font-medium ${
                currentPage === 'admin-dashboard' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              管理面板
            </button>
          )}
        </nav>

        <main className="mt-6 p-4 border rounded-xl bg-gray-50">
          {currentPage === 'quiz-apply' && <QuizApplyForm onApply={handleSubmit} />}
          {currentPage === 'comp-apply' && <CompApplyForm onApply={handleSubmit} />}
          {currentPage === 'status-query' && <StatusQueryForm onQuery={handleStatusQuery} />}
          {currentPage === 'status-result' && (
            <SubmissionResult
              status={submissionStatus}
              id={submissionId}
              data={submissionData}
              onBack={() => navigateTo('home')}
            />
          )}
          {currentPage === 'admin-login' && <AdminLoginForm onLogin={handleAdminLogin} />}
          {currentPage === 'admin-dashboard' && isAdminAuthenticated && <AdminDashboard onLogout={handleAdminLogout} backendUrl={BACKEND_URL} sessionKey={localStorage.getItem('sessionKey')} />}
          {currentPage === 'home' && (
            <div className="text-center p-8 text-gray-500">
              <p>欢迎使用公开赛审核平台。请从上方导航栏选择一个功能。</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// 答题申请表单
const QuizApplyForm = ({ onApply }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onApply('/apply-quiz', { name, email, answers });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-700">答题申请</h2>
      <div>
        <label htmlFor="quiz-name" className="block text-sm font-medium text-gray-700">
          姓名
        </label>
        <input
          id="quiz-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
          required
        />
      </div>
      <div>
        <label htmlFor="quiz-email" className="block text-sm font-medium text-gray-700">
          邮箱
        </label>
        <input
          id="quiz-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
          required
        />
      </div>
      <div>
        <label htmlFor="quiz-answers" className="block text-sm font-medium text-gray-700">
          答案（请在下方填写）
        </label>
        <textarea
          id="quiz-answers"
          value={answers}
          onChange={(e) => setAnswers(e.target.value)}
          rows="6"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
          required
        ></textarea>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700 transition-colors shadow-lg"
      >
        提交申请
      </button>
    </form>
  );
};

// 比赛申请表单
const CompApplyForm = ({ onApply }) => {
  const [name, setName] = useState('');
  const [teamMembers, setTeamMembers] = useState('');
  const [competitionDetails, setCompetitionDetails] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const membersArray = teamMembers.split(',').map(m => m.trim());
    onApply('/apply-comp', { name, members: membersArray, competitionDetails });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-700">比赛申请</h2>
      <div>
        <label htmlFor="comp-name" className="block text-sm font-medium text-gray-700">
          队伍名称
        </label>
        <input
          id="comp-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
          required
        />
      </div>
      <div>
        <label htmlFor="comp-members" className="block text-sm font-medium text-gray-700">
          队员（用逗号分隔）
        </label>
        <input
          id="comp-members"
          type="text"
          value={teamMembers}
          onChange={(e) => setTeamMembers(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
          required
        />
      </div>
      <div>
        <label htmlFor="comp-details" className="block text-sm font-medium text-gray-700">
          比赛详情
        </label>
        <textarea
          id="comp-details"
          value={competitionDetails}
          onChange={(e) => setCompetitionDetails(e.target.value)}
          rows="6"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
          required
        ></textarea>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700 transition-colors shadow-lg"
      >
        提交申请
      </button>
    </form>
  );
};

// 状态查询表单
const StatusQueryForm = ({ onQuery }) => {
  const [submissionId, setSubmissionId] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onQuery(submissionId);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-700">状态查询</h2>
      <div>
        <label htmlFor="query-id" className="block text-sm font-medium text-gray-700">
          申请ID
        </label>
        <input
          id="query-id"
          type="text"
          value={submissionId}
          onChange={(e) => setSubmissionId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-green-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-green-700 transition-colors shadow-lg"
      >
        查询状态
      </button>
    </form>
  );
};

// 提交结果和查询结果展示组件
const SubmissionResult = ({ status, id, data, onBack }) => {
  const renderContent = () => {
    if (status === 'success') {
      return (
        <div className="text-center p-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold mt-4 text-gray-800">申请提交成功！</h2>
          <p className="mt-2 text-gray-600">你的申请ID是：<code className="bg-gray-200 text-gray-800 px-2 py-1 rounded-md font-mono">{id}</code></p>
          <p className="text-gray-500">请妥善保存此ID，以便后续查询状态。</p>
        </div>
      );
    } else if (status === 'error') {
      return (
        <div className="text-center p-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold mt-4 text-gray-800">提交失败</h2>
          <p className="mt-2 text-gray-600">请检查你的网络或稍后重试。</p>
        </div>
      );
    } else if (status === 'query-success') {
      return (
        <div className="p-8 space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">申请状态查询结果</h2>
          <p className="text-gray-600">申请ID: <code className="bg-gray-200 text-gray-800 px-2 py-1 rounded-md font-mono">{data.id}</code></p>
          <div className="p-4 rounded-lg bg-white border">
            <p className="font-semibold text-gray-700">状态: <span className="font-bold text-lg text-blue-600">{data.status}</span></p>
            <p className="mt-2 text-sm text-gray-500">
              {data.type === 'quiz' ? '答题申请' : '比赛申请'}
            </p>
            {data.name && <p className="mt-1 text-sm text-gray-500">申请人/队伍名称: {data.name}</p>}
            {data.email && <p className="mt-1 text-sm text-gray-500">邮箱: {data.email}</p>}
            {data.members && <p>队员: {data.members.join(', ')}</p>}
            {data.competitionDetails && <p>比赛详情: {data.competitionDetails}</p>}
            {data.answers && <p>答案: {data.answers}</p>}
          </div>
        </div>
      );
    } else if (status === 'query-error') {
      return (
        <div className="text-center p-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold mt-4 text-gray-800">查询失败</h2>
          <p className="mt-2 text-gray-600">找不到该申请ID，请检查后重试。</p>
        </div>
      );
    }
  };

  return (
    <div>
      {renderContent()}
      <div className="mt-6 flex justify-center">
        <button
          onClick={onBack}
          className="px-6 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors font-medium"
        >
          返回
        </button>
      </div>
    </div>
  );
};

// 管理员登录表单
const AdminLoginForm = ({ onLogin }) => {
  const [password, setPassword] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-700">管理员登录</h2>
      <div>
        <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">
          密码
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-purple-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-purple-700 transition-colors shadow-lg"
      >
        登录
      </button>
    </form>
  );
};

// 管理员仪表盘
const AdminDashboard = ({ onLogout, backendUrl, sessionKey }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch(`${backendUrl}/admin/applications`, {
          headers: {
            'Authorization': `Bearer ${sessionKey}`,
          },
        });

        if (!response.ok) {
          throw new Error('获取申请列表失败，可能认证信息已过期。');
        }

        const data = await response.json();
        setApplications(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [backendUrl, sessionKey]);

  if (loading) {
    return <div className="text-center p-8 text-gray-500">加载中...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        <p>错误: {error}</p>
        <button onClick={onLogout} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md">
          重新登录
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-700 flex justify-between items-center">
        所有申请列表
        <button onClick={onLogout} className="px-4 py-2 text-sm rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors font-medium">
          退出登录
        </button>
      </h2>
      {applications.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          目前没有待处理的申请。
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {applications.map((app) => (
            <li key={app.id} className="py-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800">
                    {app.type === 'quiz' ? '答题申请' : '比赛申请'}
                    <span className="ml-2 text-sm text-gray-500">ID: {app.id}</span>
                  </p>
                  <p className="text-sm text-gray-600">状态: {app.status}</p>
                </div>
                {/* 这里可以添加更新状态的按钮，例如“批准”或“拒绝” */}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <p>名称: {app.name}</p>
                {app.email && <p>邮箱: {app.email}</p>}
                {app.members && <p>队员: {app.members.join(', ')}</p>}
                {app.competitionDetails && <p>比赛详情: {app.competitionDetails}</p>}
                {app.answers && <p>答案: {app.answers}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default App;
