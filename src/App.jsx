import { useState, useEffect } from 'react';
import { database, ref, set, onValue, remove } from './firebase';

const LEVELS = ['검정', '흰색', '보라', '남색', '파랑'];
const LEVEL_COLORS = {
  '검정': '#1f2937', '흰색': '#f3f4f6', '보라': '#c4b5fd',
  '남색': '#93c5fd', '파랑': '#7dd3fc'
};
const BASE_SCORES = { '검정': 150, '흰색': 100, '보라': 70, '남색': 60, '파랑': 40 };

const MEMBERS_BY_LEVEL = {
  '검정': ['이창주'],
  '흰색': ['송영훈', '김영재', '김영우', '정기수'],
  '보라': ['이원석', '안정욱', '이요한', '허수안', '윤원서', '김규리'],
  '남색': ['원필영', '박은혜'],
  '파랑': ['박지은', '성현주', '오수민']
};

const TEAM_LEADERS = { A: '이종률', B: '정지수' };
const LEADER_LEVEL = '흰색';
const _0x = [0x64,0x61,0x6e,0x67,0x67,0x65,0x75,0x6e];

export default function App() {
  const [view, setView] = useState('home');
  const [gameData, setGameData] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminAuth, setAdminAuth] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);

  useEffect(() => {
    const dataRef = ref(database, 'bouldering-party');
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      setGameData(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const saveData = async (data) => {
    await set(ref(database, 'bouldering-party'), data);
  };

  const _auth = (v) => v === String.fromCharCode(..._0x);

  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const assignTeams = async () => {
    const teams = { A: [], B: [] };
    const memberData = {};
    const _p = ['윤원서', '김규리'];
    const _s = '이창주';

    teams.A.push(TEAM_LEADERS.A);
    teams.B.push(TEAM_LEADERS.B);
    memberData[TEAM_LEADERS.A] = { level: LEADER_LEVEL, team: 'A', scores: [] };
    memberData[TEAM_LEADERS.B] = { level: LEADER_LEVEL, team: 'B', scores: [] };

    const _bm = shuffle(MEMBERS_BY_LEVEL['파랑']);
    const _bt = Math.random() < 0.5 ? 'A' : 'B';
    const _bt2 = _bt === 'A' ? 'B' : 'A';
    
    [_bm[0], _bm[1]].forEach(m => {
      teams[_bt].push(m);
      memberData[m] = { level: '파랑', team: _bt, scores: [] };
    });
    teams[_bt2].push(_bm[2]);
    memberData[_bm[2]] = { level: '파랑', team: _bt2, scores: [] };

    teams[_bt2].push(_s);
    memberData[_s] = { level: '검정', team: _bt2, scores: [] };

    const _pt = Math.random() < 0.5 ? 'A' : 'B';
    _p.forEach(m => {
      teams[_pt].push(m);
      memberData[m] = { level: '보라', team: _pt, scores: [] };
    });

    const _rm = shuffle(MEMBERS_BY_LEVEL['보라'].filter(m => !_p.includes(m)));
    _rm.forEach(m => {
      const t = teams.A.length <= teams.B.length ? 'A' : 'B';
      teams[t].push(m);
      memberData[m] = { level: '보라', team: t, scores: [] };
    });

    for (const level of ['흰색', '남색']) {
      const members = shuffle([...MEMBERS_BY_LEVEL[level]]);
      members.forEach(m => {
        const t = teams.A.length <= teams.B.length ? 'A' : 'B';
        teams[t].push(m);
        memberData[m] = { level, team: t, scores: [] };
      });
    }

    await saveData({ teams, members: memberData, assignedAt: new Date().toISOString() });
  };

  const calculateScore = (memberLevel, problemLevel) => {
    const mIdx = LEVELS.indexOf(memberLevel);
    const pIdx = LEVELS.indexOf(problemLevel);
    const diff = mIdx - pIdx;
    if (Math.abs(diff) > 1) return 0;
    const base = BASE_SCORES[problemLevel];
    if (diff === 1) return Math.round(base * 1.5);
    if (diff === 0) return base;
    if (diff === -1) return Math.round(base * 0.5);
    return 0;
  };

  const addProblem = async (memberName, problemLevel) => {
    if (!gameData) return;
    const member = gameData.members[memberName];
    if (!member) return;
    const score = calculateScore(member.level, problemLevel);
    if (score === 0) {
      alert('본인 난이도 ±1 범위의 문제만 집계 가능합니다!');
      return;
    }
    const newData = JSON.parse(JSON.stringify(gameData));
    if (!newData.members[memberName].scores) {
      newData.members[memberName].scores = [];
    }
    newData.members[memberName].scores.push({ 
      level: problemLevel, 
      score, 
      time: new Date().toISOString() 
    });
    await saveData(newData);
  };

  const removeProblem = async (memberName, idx) => {
    if (!gameData) return;
    const newData = JSON.parse(JSON.stringify(gameData));
    newData.members[memberName].scores.splice(idx, 1);
    await saveData(newData);
  };

  const getTeamScore = (team) => {
    if (!gameData) return 0;
    return Object.entries(gameData.members)
      .filter(([_, d]) => d.team === team)
      .reduce((sum, [_, d]) => sum + (d.scores || []).reduce((s, p) => s + p.score, 0), 0);
  };

  const getMemberScore = (name) => {
    if (!gameData?.members[name]) return 0;
    return (gameData.members[name].scores || []).reduce((s, p) => s + p.score, 0);
  };

  const getAvailableLevels = (memberLevel) => {
    const idx = LEVELS.indexOf(memberLevel);
    const available = [];
    if (idx > 0) available.push(LEVELS[idx - 1]);
    available.push(LEVELS[idx]);
    if (idx < LEVELS.length - 1) available.push(LEVELS[idx + 1]);
    return available;
  };

  const resetAll = async () => {
    if (window.confirm('모든 데이터를 초기화하시겠습니까?')) {
      await remove(ref(database, 'bouldering-party'));
    }
  };

  const handleAdminAccess = () => {
    if (_auth(pwInput)) {
      setAdminAuth(true);
      setPwError(false);
      setView('admin');
    } else {
      setPwError(true);
    }
    setPwInput('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (view === 'adminLogin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-slate-200 p-4">
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-center mb-6">🔐 관리자 인증</h2>
            <input
              type="password"
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminAccess()}
              placeholder="비밀번호 입력"
              className="w-full p-3 border-2 rounded-lg mb-3 text-center text-lg"
              autoFocus
            />
            {pwError && <p className="text-red-500 text-center text-sm mb-3">비밀번호가 틀렸습니다</p>}
            <div className="flex gap-2">
              <button onClick={() => setView('home')} className="flex-1 py-3 bg-gray-200 rounded-lg font-semibold">취소</button>
              <button onClick={handleAdminAccess} className="flex-1 py-3 bg-purple-500 text-white rounded-lg font-semibold">확인</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">🧗 볼더링 파티</h1>
          <p className="text-center text-gray-600 mb-8">당근 클라이밍 크루 🥕</p>

          {gameData ? (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-lg text-center">
                <p className="text-green-600 font-semibold mb-2">✅ 팀 배정 완료!</p>
                <div className="flex justify-center gap-8 text-lg">
                  <span className="text-rose-500 font-bold">A팀: {gameData.teams.A.length}명</span>
                  <span className="text-sky-500 font-bold">B팀: {gameData.teams.B.length}명</span>
                </div>
              </div>

              <button onClick={() => setView('user')} className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold rounded-xl shadow-lg active:scale-95 transition">
                📝 내 점수 입력하기
              </button>

              <button onClick={() => setView('scoreboard')} className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xl font-bold rounded-xl shadow-lg active:scale-95 transition">
                📊 전체 현황 보기
              </button>

              <button onClick={() => setView('adminLogin')} className="w-full py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl">
                ⚙️ 관리자 모드
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <p className="text-gray-500 mb-4">아직 팀이 배정되지 않았습니다</p>
                <button onClick={() => setView('adminLogin')} className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl">
                  🎯 팀 배정하러 가기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'admin' && adminAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-slate-200 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">⚙️ 관리자 모드</h1>
            <button onClick={() => { setView('home'); setAdminAuth(false); }} className="text-gray-500 text-2xl">✕</button>
          </div>

          <div className="space-y-4">
            <button onClick={assignTeams} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg font-bold rounded-xl shadow-lg active:scale-95 transition">
              🎲 {gameData ? '팀 다시 배정' : '팀 배정 시작'}
            </button>

            {gameData && (
              <>
                <div className="bg-white rounded-xl p-4 shadow">
                  <h3 className="font-bold mb-3">현재 팀 구성</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-rose-500 font-bold mb-2">A팀 ({gameData.teams.A.length}명)</div>
                      {gameData.teams.A.map(name => (
                        <div key={name} className="text-sm py-1">
                          {name === TEAM_LEADERS.A ? `👑 ${name}` : `• ${name}`}
                          <span className="text-gray-400 ml-1">({gameData.members[name]?.level})</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-sky-500 font-bold mb-2">B팀 ({gameData.teams.B.length}명)</div>
                      {gameData.teams.B.map(name => (
                        <div key={name} className="text-sm py-1">
                          {name === TEAM_LEADERS.B ? `👑 ${name}` : `• ${name}`}
                          <span className="text-gray-400 ml-1">({gameData.members[name]?.level})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={resetAll} className="w-full py-3 bg-red-100 text-red-600 font-semibold rounded-xl">
                  🗑️ 전체 초기화
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'user') {
    if (!selectedUser) {
      const allMembers = gameData ? Object.keys(gameData.members).sort() : [];
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 p-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800">👤 이름 선택</h1>
              <button onClick={() => setView('home')} className="text-gray-500 text-2xl">✕</button>
            </div>
            <div className="space-y-2">
              {LEVELS.map(level => {
                const levelMembers = allMembers.filter(m => gameData.members[m].level === level);
                if (levelMembers.length === 0) return null;
                return (
                  <div key={level} className="mb-4">
                    <div className="text-sm font-semibold px-3 py-1 rounded-lg mb-2" style={{ backgroundColor: LEVEL_COLORS[level], color: level === '검정' ? 'white' : 'black' }}>
                      {level} 난이도
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {levelMembers.map(name => (
                        <button key={name} onClick={() => setSelectedUser(name)}
                          className={`p-3 rounded-lg text-left font-medium transition active:scale-95 ${gameData.members[name].team === 'A' ? 'bg-rose-100 hover:bg-rose-200 border-2 border-rose-300' : 'bg-sky-100 hover:bg-sky-200 border-2 border-sky-300'}`}>
                          <span>{name}</span>
                          <span className="text-xs ml-1 opacity-60">({gameData.members[name].team}팀)</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    const member = gameData.members[selectedUser];
    const availableLevels = getAvailableLevels(member.level);
    const memberIdx = LEVELS.indexOf(member.level);
    const scores = member.scores || [];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setSelectedUser(null)} className="text-gray-500">← 뒤로</button>
            <button onClick={() => { setSelectedUser(null); setView('home'); }} className="text-gray-500 text-2xl">✕</button>
          </div>

          <div className={`rounded-xl p-4 mb-4 ${member.team === 'A' ? 'bg-rose-100' : 'bg-sky-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedUser}</h2>
                <p className="text-sm opacity-70">{member.level} 난이도 · {member.team}팀</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{getMemberScore(selectedUser)}</div>
                <div className="text-sm opacity-70">점</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg mb-4">
            <h3 className="font-bold mb-3">🧗 문제 완등 추가</h3>
            <div className="grid grid-cols-3 gap-2">
              {availableLevels.map(level => {
                const levelIdx = LEVELS.indexOf(level);
                const diff = memberIdx - levelIdx;
                const label = diff === 1 ? '도전' : diff === 0 ? '적정' : '기본';
                const score = calculateScore(member.level, level);
                return (
                  <button key={level} onClick={() => addProblem(selectedUser, level)}
                    className="p-3 rounded-lg text-center transition active:scale-95 hover:opacity-80"
                    style={{ backgroundColor: LEVEL_COLORS[level], color: level === '검정' ? 'white' : 'black' }}>
                    <div className="font-bold">{level}</div>
                    <div className="text-xs opacity-70">{label}</div>
                    <div className="text-lg font-bold">+{score}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg">
            <h3 className="font-bold mb-3">📋 완등 기록 ({scores.length}개)</h3>
            {scores.length === 0 ? (
              <p className="text-gray-400 text-center py-4">아직 기록이 없습니다</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {scores.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-center text-sm font-medium py-1 rounded"
                        style={{ backgroundColor: LEVEL_COLORS[s.level], color: s.level === '검정' ? 'white' : 'black' }}>
                        {s.level}
                      </span>
                      <span className="font-bold">+{s.score}점</span>
                    </div>
                    <button onClick={() => removeProblem(selectedUser, idx)} className="text-red-400 hover:text-red-600 px-2">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'scoreboard') {
    const teamAScore = getTeamScore('A');
    const teamBScore = getTeamScore('B');
    const allMembers = gameData ? Object.entries(gameData.members) : [];
    const ranking = allMembers
      .map(([name, data]) => ({ name, ...data, total: (data.scores || []).reduce((s, p) => s + p.score, 0) }))
      .sort((a, b) => b.total - a.total);

    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-100 to-blue-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">📊 전체 현황</h1>
            <button onClick={() => setView('home')} className="text-gray-500 text-2xl">✕</button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`rounded-xl p-4 text-center ${teamAScore >= teamBScore ? 'bg-rose-500 text-white' : 'bg-rose-100'}`}>
              <div className="text-lg font-bold">🔴 A팀</div>
              <div className="text-4xl font-black my-2">{teamAScore}</div>
              <div className="text-sm opacity-80">점</div>
            </div>
            <div className={`rounded-xl p-4 text-center ${teamBScore > teamAScore ? 'bg-sky-500 text-white' : 'bg-sky-100'}`}>
              <div className="text-lg font-bold">🔵 B팀</div>
              <div className="text-4xl font-black my-2">{teamBScore}</div>
              <div className="text-sm opacity-80">점</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow mb-4 text-center">
            <span className="text-gray-500">점수 차이: </span>
            <span className={`text-2xl font-bold ${teamAScore >= teamBScore ? 'text-rose-500' : 'text-sky-500'}`}>
              {Math.abs(teamAScore - teamBScore)}점
            </span>
            <span className="text-gray-500"> ({teamAScore > teamBScore ? 'A팀' : teamBScore > teamAScore ? 'B팀' : '동점'} {teamAScore !== teamBScore ? '리드' : ''})</span>
          </div>

          <div className="bg-white rounded-xl p-4 shadow">
            <h3 className="font-bold mb-3">🏆 개인 순위</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {ranking.map((member, idx) => (
                <div key={member.name}
                  className={`flex items-center justify-between p-3 rounded-lg ${member.team === 'A' ? 'bg-rose-50' : 'bg-sky-50'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                      idx === 0 ? 'bg-yellow-400 text-white' :
                      idx === 1 ? 'bg-gray-300 text-white' :
                      idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100'
                    }`}>{idx + 1}</span>
                    <div>
                      <span className="font-medium">{member.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{member.level}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{member.total}점</div>
                    <div className="text-xs text-gray-400">{(member.scores || []).length}개</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
