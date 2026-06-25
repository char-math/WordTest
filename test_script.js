
        // 全局变量
        let wordData = embeddedWordData;
        let testQuestions = [];
        let currentQuestionIndex = 0;
        let correctCount = 0;
        let consecutiveIncorrect = 0;
        let totalIncorrect = 0;
        let primaryCorrect = 0;
        let middleCorrect = 0;
        let highCorrect = 0;
        let currentUser = null;
        let token = null;
        let wrongWords = []; // 存储错题
        let testHistoryData = []; // 存储历史测评记录用于图表
        
        // PK相关变量
        let pkQuestions = [];
        let currentPkQuestionIndex = 0;
        let userScore = 0;
        let aiScore = 0;
        let pkRound = 10; // 10回合PK
        let timeLimit = 10; // 每题时间限制（秒）
        let timerInterval = null;
        let remainingTime = timeLimit;
        
        // 开始AI PK
        function startAiPk() {
            const difficulty = prompt('请选择AI难度：\n1. 小学AI（简单）\n2. 初中AI（中等）\n3. 高中AI（困难）', '2');
            
            if (!difficulty) return;
            
            switch(difficulty) {
                case '1':
                    currentAiDifficulty = 'easy';
                    break;
                case '2':
                    currentAiDifficulty = 'medium';
                    break;
                case '3':
                    currentAiDifficulty = 'hard';
                    break;
                default:
                    currentAiDifficulty = 'medium';
            }
            
            generatePkQuestions();
            currentPkQuestionIndex = 0;
            userScore = 0;
            aiScore = 0;
            
            document.getElementById('user-score').textContent = userScore;
            document.getElementById('ai-score').textContent = aiScore;
            document.getElementById('ai-name').textContent = getAiName();
            
            showPage('pk-page');
            showCurrentPkQuestion();
        }
        
        // 开始用户匹配PK
        function startUserPk() {
            showPage('user-pk-page');
            loadPKRooms();
        }
        
        // 返回首页
        function goToStartPage() {
            showPage('start-page');
            updateBottomNav('nav-test');
        }
        
        // 暴露到全局作用域，供HTML onclick使用
        window.startAiPk = startAiPk;
        window.startUserPk = startUserPk;
        window.goToStartPage = goToStartPage;
        
        // 用户PK相关变量
        let userPkQuestions = [];
        let currentUserPkQuestionIndex = 0;
        let userPkScore1 = 0;
        let userPkScore2 = 0;
        let userPkOpponent = null;
        let userPkTimerInterval = null;
        let userPkRemainingTime = timeLimit;
        let userPkSharedRemainingTime = 15;
        let userPkSyncInterval = null;
        let currentRoom = null;
        let pkRooms = [];
        let roomRefreshInterval = null;

        // 页面加载时恢复登录状态
        function restoreLoginState() {
            const savedToken = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');
            
            if (savedToken && savedUser) {
                token = savedToken;
                currentUser = JSON.parse(savedUser);
                
                // 更新UI显示用户信息
                const userInfoDiv = document.getElementById('user-info');
                if (userInfoDiv) {
                    userInfoDiv.innerHTML = `
                        <p><strong>用户名：</strong>${currentUser.username}</p>
                        <p><strong>角色：</strong>${currentUser.role === 'admin' ? '管理员' : '普通用户'}</p>
                    `;
                }
                
                // 如果是管理员，显示管理员后台按钮
                const toAdminBtn = document.getElementById('to-admin');
                if (toAdminBtn) {
                    if (currentUser.role === 'admin') {
                        toAdminBtn.style.display = 'inline-block';
                        console.log('用户是管理员，显示管理员后台按钮');
                    } else {
                        toAdminBtn.style.display = 'none';
                        console.log('用户不是管理员，隐藏管理员后台按钮');
                    }
                }
                
                console.log('已恢复登录状态:', currentUser.username, '角色:', currentUser.role);
                updateStartPageInfo();
                // 更新按钮显示
                const loginBtn = document.getElementById('login-btn');
                const profileBtn = document.getElementById('profile-btn');
                if (loginBtn) loginBtn.classList.add('d-none');
                if (profileBtn) profileBtn.classList.remove('d-none');
            }
        }
        
        // 更新首页提示信息
        function updateStartPageInfo() {
            const infoList = document.getElementById('start-page-info');
            if (!infoList) return;
            
            infoList.innerHTML = `
                <li class="mb-2">? 欢迎回来，${currentUser.username}！</li>
                <li class="mb-2">? 进入个人中心查看历史记录和错题本</li>
                <li class="mb-2">? 完成测评提升你的词汇量水平</li>
            `;
        }
        
        // 恢复首页原始提示信息
        function resetStartPageInfo() {
            const infoList = document.getElementById('start-page-info');
            if (!infoList) return;
            
            infoList.innerHTML = `
                <li class="mb-2">? 共50题，涵盖小学、初中、高中各难度级别</li>
                <li class="mb-2">? 每题6个选项（1个正确 + 4个干扰 + "不认识"）</li>
                <li class="mb-2">? 结束条件：完成50题 或 连续答错4题 或 累计答错7题</li>
            `;
        }

        // 单词分布配置
        const wordDistribution = [
            { level: 'primary', difficulty: 1, count: 4 },
            { level: 'primary', difficulty: 2, count: 6 },
            { level: 'primary', difficulty: 3, count: 6 },
            { level: 'middle', difficulty: 1, count: 6 },
            { level: 'middle', difficulty: 2, count: 6 },
            { level: 'middle', difficulty: 3, count: 6 },
            { level: 'high', difficulty: 1, count: 6 },
            { level: 'high', difficulty: 2, count: 6 },
            { level: 'high', difficulty: 3, count: 4 }
        ];

        // 加载词库数据
        function loadWordData() {
            console.log('Word data loaded successfully');
            console.log('Primary words:', wordData.primary.length);
            console.log('Middle words:', wordData.middle.length);
            console.log('High words:', wordData.high.length);
        }

        // 页面切换函数
        function showPage(pageId) {
            console.log('showPage called with:', pageId);
            const targetPage = document.getElementById(pageId);
            console.log('目标页面元素:', targetPage);
            // 隐藏所有页面
            document.querySelectorAll('.card').forEach(card => {
                card.classList.add('d-none');
            });
            // 显示指定页面
            document.getElementById(pageId).classList.remove('d-none');
        }

        // 生成PK题目
        function generatePkQuestions() {
            pkQuestions = [];
            
            // 从所有单词中随机选择pkRound个单词，并添加level属性
            const allWords = [];
            
            // 添加小学单词
            wordData.primary.forEach(word => {
                allWords.push({ ...word, level: 'primary' });
            });
            
            // 添加初中单词
            wordData.middle.forEach(word => {
                allWords.push({ ...word, level: 'middle' });
            });
            
            // 添加高中单词
            wordData.high.forEach(word => {
                allWords.push({ ...word, level: 'high' });
            });
            
            while (pkQuestions.length < pkRound && allWords.length > 0) {
                const randomIndex = Math.floor(Math.random() * allWords.length);
                const selectedWord = allWords[randomIndex];
                pkQuestions.push(selectedWord);
                allWords.splice(randomIndex, 1);
            }
        }

        // 启动倒计时
        function startTimer() {
            // 清除之前的定时器
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            
            remainingTime = timeLimit;
            document.getElementById('pk-timer').textContent = `时间：${remainingTime}秒`;
            
            timerInterval = setInterval(() => {
                remainingTime--;
                document.getElementById('pk-timer').textContent = `时间：${remainingTime}秒`;
                
                if (remainingTime <= 0) {
                    clearInterval(timerInterval);
                    // 时间到，自动进入下一题
                    handleTimeUp();
                }
            }, 1000);
        }

        // 处理时间到的情况
        function handleTimeUp() {
            // 如果已经抢答了，不处理
            if (questionAnswered) return;
            
            // 标记为已抢答（AI抢到）
            questionAnswered = true;
            
            // 标记用户未答题
            const userResult = document.getElementById('user-result');
            userResult.innerHTML = '<span class="text-danger">? 未抢到！</span>';
            
            // AI抢答
            const question = pkQuestions[currentPkQuestionIndex];
            const aiCorrect = aiAnswer(question);
            if (aiCorrect) aiScore++;
            
            // 更新AI分数
            document.getElementById('ai-score').textContent = aiScore;
            
            // 显示AI结果
            const aiResult = document.getElementById('ai-result');
            aiResult.innerHTML = aiCorrect ? 
                '<span class="text-success">? AI抢答成功！</span>' : 
                '<span class="text-danger">? AI答错了</span>';
            
            // 标记正确选项
            document.querySelectorAll('.option-btn').forEach(btn => {
                if (btn.dataset.correct === 'true') {
                    btn.classList.add('correct');
                }
                btn.disabled = true;
            });
            
            // 延迟1.5秒后自动进入下一题
            setTimeout(() => {
                goToNextPkQuestion();
            }, 1500);
        }

        // 显示当前PK题目
        function showCurrentPkQuestion() {
            if (currentPkQuestionIndex >= pkQuestions.length) {
                showPkResult();
                return;
            }
            
            const question = pkQuestions[currentPkQuestionIndex];
            document.getElementById('pk-word').textContent = question.word;
            document.getElementById('pk-phonetic').textContent = question.phonetic || '';
            
            // 生成选项
            const correctMeaning = question.meaning;
            const distractors = generateDistractors(correctMeaning, question.level);
            const options = [correctMeaning, ...distractors, '不认识'];
            
            // 打乱选项顺序（但不认识固定在最后）
            for (let i = options.length - 2; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }
            
            // 显示选项
            const optionsContainer = document.getElementById('pk-options');
            optionsContainer.innerHTML = '';
            
            options.forEach((option, index) => {
                const button = document.createElement('button');
                button.className = 'option-btn';
                button.textContent = option;
                button.dataset.index = index;
                button.dataset.correct = option === correctMeaning;
                
                button.addEventListener('click', function() {
                    // 清除定时器
                    if (timerInterval) {
                        clearInterval(timerInterval);
                    }
                    
                    // 移除其他选项的选中状态
                    document.querySelectorAll('.option-btn').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    
                    // 添加当前选项的选中状态
                    this.classList.add('selected');
                    
                    // 直接检查答案并自动进入下一题
                    checkPkAnswer();
                });
                
                optionsContainer.appendChild(button);
            });
            
            // 重置结果显示
            document.getElementById('user-result').innerHTML = '';
            document.getElementById('ai-result').innerHTML = '';
            
            // 启动倒计时
            startTimer();
        }

        // AI难度配置
        const aiDifficulties = {
            easy: { name: '小学AI', correctRates: { primary: 0.9, middle: 0.5, high: 0.2 }, delay: 3000 },
            medium: { name: '初中AI', correctRates: { primary: 0.95, middle: 0.8, high: 0.5 }, delay: 2000 },
            hard: { name: '高中AI', correctRates: { primary: 1.0, middle: 0.95, high: 0.8 }, delay: 1500 }
        };
        
        let currentAiDifficulty = 'medium';
        
        // AI答题逻辑
        function aiAnswer(question) {
            const difficulty = aiDifficulties[currentAiDifficulty];
            const correctRate = difficulty.correctRates[question.level] || 0.5;
            return Math.random() < correctRate;
        }
        
        // 获取AI延迟时间
        function getAiDelay() {
            return aiDifficulties[currentAiDifficulty].delay;
        }
        
        // 获取当前AI名称
        function getAiName() {
            return aiDifficulties[currentAiDifficulty].name;
        }

        let aiAnswerTimeout = null; // AI答题定时器
        let questionAnswered = false; // 当前题是否已被抢答
        
        // 检查PK答案（抢答机制）
        function checkPkAnswer() {
            // 如果已经有人抢答了，不处理
            if (questionAnswered) return false;
            
            const selectedButton = document.querySelector('.option-btn.selected');
            if (!selectedButton) return false;
            
            // 标记为已抢答
            questionAnswered = true;
            
            // 清除定时器和AI答题定时器
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            if (aiAnswerTimeout) {
                clearTimeout(aiAnswerTimeout);
            }
            
            const question = pkQuestions[currentPkQuestionIndex];
            const userCorrect = selectedButton.dataset.correct === 'true';
            
            // 更新分数（抢答成功）
            if (userCorrect) userScore++;
            
            // 更新分数显示
            document.getElementById('user-score').textContent = userScore;
            document.getElementById('ai-score').textContent = aiScore;
            
            // 显示结果
            const userResult = document.getElementById('user-result');
            const aiResult = document.getElementById('ai-result');
            
            if (userCorrect) {
                userResult.innerHTML = '<span class="text-success">? 抢答成功！</span>';
                aiResult.innerHTML = '<span class="text-muted">AI未抢到</span>';
            } else {
                userResult.innerHTML = '<span class="text-danger">? 答错了</span>';
                // 用户答错，AI仍然有机会答题
                aiResult.innerHTML = '<span class="text-success">? AI答对了</span>';
                aiScore++;
                document.getElementById('ai-score').textContent = aiScore;
            }
            
            // 标记选项
            document.querySelectorAll('.option-btn').forEach(btn => {
                if (btn.dataset.correct === 'true') {
                    btn.classList.add('correct');
                } else if (btn === selectedButton && !userCorrect) {
                    btn.classList.add('incorrect');
                }
                btn.disabled = true;
            });
            
            // 延迟1.5秒后自动进入下一题
            setTimeout(() => {
                goToNextPkQuestion();
            }, 1500);
            
            return true;
        }
        
        // 进入下一题
        function goToNextPkQuestion() {
            // 重置抢答状态
            questionAnswered = false;
            currentPkQuestionIndex++;
            
            if (currentPkQuestionIndex >= pkQuestions.length) {
                showPkResult();
            } else {
                showCurrentPkQuestion();
            }
        }

        // 显示PK结果
        function showPkResult() {
            // 清除定时器
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            
            // 显示结果
            const userResult = document.getElementById('user-result');
            const aiResult = document.getElementById('ai-result');
            
            if (userScore > aiScore) {
                userResult.innerHTML = '<h4 class="text-success">?? 你赢了！</h4>';
                aiResult.innerHTML = '<h4 class="text-danger">AI输了</h4>';
            } else if (userScore < aiScore) {
                userResult.innerHTML = '<h4 class="text-danger">你输了</h4>';
                aiResult.innerHTML = '<h4 class="text-success">?? AI赢了！</h4>';
            } else {
                userResult.innerHTML = '<h4 class="text-warning">平局</h4>';
                aiResult.innerHTML = '<h4 class="text-warning">平局</h4>';
            }
            
            // 显示重新PK按钮
            document.getElementById('pk-next-btn').classList.add('d-none');
            document.getElementById('pk-restart-btn').classList.remove('d-none');
        }
        
        // 加载PK房间列表
        async function loadPKRooms() {
            const roomsList = document.getElementById('pk-rooms-list');
            roomsList.innerHTML = '<p class="text-muted">正在加载房间...</p>';
            
            try {
                const response = await fetch('/api/pk/rooms', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('加载房间列表失败:', errorData.message);
                    roomsList.innerHTML = `<p class="text-danger">加载房间列表失败: ${errorData.message || '网络错误'}</p>`;
                    return;
                }
                
                const data = await response.json();
                pkRooms = data.rooms || [];
                
                if (pkRooms.length === 0) {
                    roomsList.innerHTML = '<p class="text-muted">暂无可用房间，请创建一个</p>';
                    return;
                }
                
                let html = '<table class="table table-sm"><thead><tr><th>房间名称</th><th>房主</th><th>人数</th><th>状态</th><th>操作</th></tr></thead><tbody>';
                pkRooms.forEach(room => {
                    const statusText = room.status === 'waiting' ? '等待中' : '准备就绪';
                    const statusClass = room.status === 'waiting' ? 'text-success' : 'text-primary';
                    const canJoin = room.players < room.maxPlayers && room.status === 'waiting';
                    const isInRoom = room.playersIds && room.playersIds.includes(currentUser.id);
                    
                    html += `<tr>
                        <td>${room.name}</td>
                        <td>${room.host}</td>
                        <td>${room.players}/${room.maxPlayers}</td>
                        <td><span class="${statusClass}">${statusText}</span></td>
                        <td>
                            ${isInRoom ? `
                                <button class="btn btn-sm btn-outline-info" onclick="enterRoom(${room.id})">进入</button>
                            ` : `
                                <button class="btn btn-sm ${canJoin ? 'btn-outline-primary' : 'btn-secondary'}" 
                                        onclick="joinPKRoom(${room.id})" 
                                        ${!canJoin ? 'disabled' : ''}>
                                    ${canJoin ? '加入' : '已满'}
                                </button>
                            `}
                        </td>
                    </tr>`;
                });
                html += '</tbody></table>';
                roomsList.innerHTML = html;
            } catch (error) {
                console.error('加载房间列表失败:', error);
                roomsList.innerHTML = '<p class="text-danger">加载房间列表失败: ' + error.message + '</p>';
            }
        }
        
        // 进入已有房间
        async function enterRoom(roomId) {
            try {
                const response = await fetch(`/api/pk/rooms/${roomId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const data = await response.json();
                if (response.ok) {
                    currentRoom = data.room;
                    userPkOpponent = { name: currentRoom.playersList.find(p => p !== currentUser.username), id: currentRoom.id };
                    showWaitingRoom(currentRoom);
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('进入房间失败:', error);
                alert('进入房间失败');
            }
        }
        
        // 创建房间
        async function createRoom() {
            const roomName = prompt('请输入房间名称：', `${currentUser.username}的PK房间`);
            if (!roomName) return;
            
            try {
                const response = await fetch('/api/pk/rooms', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name: roomName })
                });
                
                const data = await response.json();
                if (response.ok) {
                    currentRoom = data.room;
                    showWaitingRoom(currentRoom);
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('创建房间失败:', error);
                alert('创建房间失败');
            }
        }
        
        // 显示等待房间界面
        function showWaitingRoom(room) {
            const roomsList = document.getElementById('pk-rooms-list');
            roomsList.innerHTML = `
                <div class="text-center py-4">
                    <h5>房间 "${room.name}"</h5>
                    <p class="text-muted mt-2">房主：${room.host}</p>
                    <p class="text-muted">当前人数：${room.players}/${room.maxPlayers}</p>
                    <div class="mt-3 p-3 border rounded">
                        <p>已加入玩家：</p>
                        <div class="d-flex justify-content-center gap-2 flex-wrap">
                            ${room.playersList.map(p => `<span class="badge bg-primary">${p}</span>`).join('')}
                        </div>
                    </div>
                    ${room.players >= room.maxPlayers ? `
                        <button class="btn btn-primary mt-4" onclick="startUserPKGame()">开始PK</button>
                    ` : `
                        <p class="text-muted mt-3">等待对手加入...</p>
                    `}
                    <button class="btn btn-outline-danger mt-2" onclick="leaveRoom()">离开房间</button>
                </div>
            `;
            
            // 如果还没满员，开始定时刷新检查
            if (room.players < room.maxPlayers) {
                if (roomRefreshInterval) clearInterval(roomRefreshInterval);
                roomRefreshInterval = setInterval(() => {
                    refreshRoomStatus(room.id);
                }, 2000);
            }
        }
        
        // 刷新房间状态
        async function refreshRoomStatus(roomId) {
            try {
                const response = await fetch(`/api/pk/rooms/${roomId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const data = await response.json();
                if (response.ok && data.room) {
                    const room = data.room;
                    if (room.players !== currentRoom.players) {
                        // 房间状态变化了
                        currentRoom.players = room.players;
                        currentRoom.playersList = room.playersList;
                        currentRoom.status = room.status;
                        userPkOpponent = { name: room.playersList.find(p => p !== currentUser.username), id: room.id };
                        showWaitingRoom(currentRoom);
                    }
                }
            } catch (error) {
                console.error('刷新房间状态失败:', error);
            }
        }
        
        // 加入房间
        async function joinPKRoom(roomId) {
            try {
                const response = await fetch(`/api/pk/rooms/${roomId}/join`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const data = await response.json();
                if (response.ok) {
                    currentRoom = data.room;
                    userPkOpponent = { name: currentRoom.playersList.find(p => p !== currentUser.username), id: currentRoom.id };
                    showWaitingRoom(currentRoom);
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('加入房间失败:', error);
                alert('加入房间失败');
            }
        }
        
        // 离开房间
        async function leaveRoom() {
            if (!currentRoom) {
                loadPKRooms();
                return;
            }
            
            try {
                await fetch(`/api/pk/rooms/${currentRoom.id}/leave`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
            } catch (error) {
                console.error('离开房间失败:', error);
            }
            
            // 清除定时刷新
            if (roomRefreshInterval) {
                clearInterval(roomRefreshInterval);
                roomRefreshInterval = null;
            }
            
            currentRoom = null;
            loadPKRooms();
        }
        
        // 开始用户PK游戏
        async function startUserPKGame() {
            try {
                console.log('开始PK游戏，房间ID:', currentRoom.id);
                
                // 从后端获取游戏题目和状态
                const response = await fetch(`/api/pk/rooms/${currentRoom.id}/game`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log('响应状态:', response.status);
                const data = await response.json();
                console.log('响应数据:', data);
                
                if (response.ok) {
                    // 使用后端统一生成的题目
                    userPkQuestions = data.questions;
                    userPkScores = data.scores;
                    currentUserPkQuestionIndex = data.currentQuestionIndex;
                    
                    // 获取对手信息
                    const opponentId = data.playersIds.find(id => id !== currentUser.id);
                    const opponentIndex = data.playersIds.indexOf(opponentId);
                    userPkOpponent = { 
                        name: data.playersList[opponentIndex], 
                        id: opponentId 
                    };
                    
                    // 重置分数
                    userPkScore1 = userPkScores[currentUser.id] || 0;
                    userPkScore2 = userPkScores[opponentId] || 0;
                    
                    // 更新UI
                    document.getElementById('opponent-name').textContent = userPkOpponent.name;
                    document.getElementById('final-opponent-name').textContent = userPkOpponent.name;
                    document.getElementById('user-pk-score1').textContent = userPkScore1;
                    document.getElementById('user-pk-score2').textContent = userPkScore2;
                    
                    // 切换显示
                    document.getElementById('user-pk-rooms').classList.add('d-none');
                    document.getElementById('user-pk-arena').classList.remove('d-none');
                    document.getElementById('user-pk-result').classList.add('d-none');
                    
                    showUserPkQuestion();
                } else {
                    alert('开始PK失败: ' + (data.message || '获取游戏状态失败'));
                }
            } catch (error) {
                console.error('开始PK游戏失败:', error);
                alert('开始PK游戏失败: ' + error.message);
            }
        }
        
        // 生成用户PK题目
        function generateUserPkQuestions() {
            userPkQuestions = [];
            const allWords = [];
            
            // 收集所有单词
            wordData.primary.forEach(word => allWords.push({ ...word, level: 'primary' }));
            wordData.middle.forEach(word => allWords.push({ ...word, level: 'middle' }));
            wordData.high.forEach(word => allWords.push({ ...word, level: 'high' }));
            
            // 随机选择pkRound个单词
            while (userPkQuestions.length < pkRound && allWords.length > 0) {
                const randomIndex = Math.floor(Math.random() * allWords.length);
                const selectedWord = allWords.splice(randomIndex, 1)[0];
                userPkQuestions.push(selectedWord);
            }
        }
        
        // 显示用户PK题目
        async function showUserPkQuestion() {
            console.log('[PK] showUserPkQuestion called, __pkAdvancing=', window.__pkAdvancing, 'qIdx=', currentUserPkQuestionIndex);
            if (window.__pkAdvancing) {
                console.log('[PK] blocked by __pkAdvancing=true');
                return;
            }
            
            let currentQuestion = null;
            try {
                const response = await fetch(`/api/pk/rooms/${currentRoom.id}/game`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                console.log('[PK] /game response in showUserPkQuestion:', data?.currentQuestionIndex, 'myTime:', data?.myRemainingTime);
                if (response.ok) {
                    userPkQuestions = data.questions;
                    currentUserPkQuestionIndex = data.currentQuestionIndex;
                    userPkScore1 = data.scores[currentUser.id] || 0;
                    userPkScore2 = (userPkOpponent && data.scores[userPkOpponent.id] !== undefined) ? data.scores[userPkOpponent.id] : 0;
                    currentQuestion = userPkQuestions[currentUserPkQuestionIndex];
                    userPkSharedRemainingTime = data.sharedRemainingTime || 15;
                }
            } catch (error) {
                console.error('获取游戏状态失败:', error);
                currentQuestion = userPkQuestions[currentUserPkQuestionIndex];
                userPkSharedRemainingTime = 15;
            }
            
            if (!currentQuestion) {
                console.log('[PK] no currentQuestion, showing result');
                showUserPkResult();
                return;
            }
            
            const question = currentQuestion;
            document.getElementById('user-pk-score1').textContent = userPkScore1;
            document.getElementById('user-pk-score2').textContent = userPkScore2;
            document.getElementById('user-pk-word').textContent = question.word;
            document.getElementById('user-pk-phonetic').textContent = question.phonetic || '';
            document.getElementById('user-pk-result1').innerHTML = '';
            document.getElementById('user-pk-result2').innerHTML = '';
            document.getElementById('user-pk-timer').textContent = `? 本题剩余：${userPkSharedRemainingTime}秒`;
            
            window.__pkIAnswered = false;
            window.__pkMyAnswerCorrect = null;
            
            const options = question.options || [];
            const correctMeaning = question.correctAnswer || question.meaning;
            const optionsContainer = document.getElementById('user-pk-options');
            optionsContainer.innerHTML = '';
            options.forEach((option) => {
                const button = document.createElement('button');
                button.className = 'option-btn';
                button.textContent = option;
                button.dataset.correct = option === correctMeaning;
                button.addEventListener('click', function() {
                    handlePkOptionClick(option === correctMeaning);
                });
                optionsContainer.appendChild(button);
            });
            
            document.getElementById('user-pk-next-btn').classList.add('d-none');
            document.getElementById('user-pk-finish-btn').classList.add('d-none');
            
            if (userPkTimerInterval) clearInterval(userPkTimerInterval);
            if (userPkSyncInterval) clearInterval(userPkSyncInterval);
            
            userPkTimerInterval = setInterval(() => {
                if (window.__pkIAnswered || window.__pkAdvancing) {
                    clearInterval(userPkTimerInterval);
                    userPkTimerInterval = null;
                    return;
                }
                userPkSharedRemainingTime--;
                document.getElementById('user-pk-timer').textContent = `? 本题剩余：${Math.max(0, userPkSharedRemainingTime)}秒`;
                if (userPkSharedRemainingTime <= 0) {
                    clearInterval(userPkTimerInterval);
                    userPkTimerInterval = null;
                    if (!window.__pkIAnswered) {
                        handlePkOptionClick(false, true);
                    }
                }
            }, 1000);
            
            userPkSyncInterval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/pk/rooms/${currentRoom.id}/game`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (response.ok) {
                        userPkScore1 = data.scores[currentUser.id] || 0;
                        userPkScore2 = (userPkOpponent && data.scores[userPkOpponent.id] !== undefined) ? data.scores[userPkOpponent.id] : 0;
                        document.getElementById('user-pk-score1').textContent = userPkScore1;
                        document.getElementById('user-pk-score2').textContent = userPkScore2;
                        
                        // 使用服务端的共享时间（同步校准）
                        if (!window.__pkIAnswered && !window.__pkAdvancing) {
                            userPkSharedRemainingTime = data.sharedRemainingTime || 0;
                            document.getElementById('user-pk-timer').textContent = `? 本题剩余：${Math.max(0, userPkSharedRemainingTime)}秒`;
                        }
                        
                        // 若双方答完 或 服务端已自动推进，则结算
                        const condition = (data.currentBothAnswered || data.currentQuestionIndex !== currentUserPkQuestionIndex) && !window.__pkSettling && !window.__pkSettled && !window.__pkAdvancing;
                        if (condition) {
                            console.log('[PK] sync: triggering settle, bothAnswered=', data.currentBothAnswered, 'qIdx diff=', data.currentQuestionIndex !== currentUserPkQuestionIndex);
                            window.__pkSettling = true;
                            clearInterval(userPkSyncInterval);
                            userPkSyncInterval = null;
                            await settlePkQuestion(data);
                        }
                    }
                } catch (error) {
                    console.error('同步失败:', error);
                }
            }, 2000);
        }
        
        async function handlePkOptionClick(isCorrect, isTimeout) {
            console.log('[PK] handlePkOptionClick: isCorrect=', isCorrect, 'isTimeout=', isTimeout, 'qIdx=', currentUserPkQuestionIndex);
            if (window.__pkIAnswered) return;
            if (window.__pkAnswering) return;
            
            window.__pkAnswering = true;
            window.__pkIAnswered = true;
            window.__pkMyAnswerCorrect = isCorrect;
            
            if (userPkTimerInterval) {
                clearInterval(userPkTimerInterval);
                userPkTimerInterval = null;
            }
            
            const userResult1 = document.getElementById('user-pk-result1');
            
            if (!isCorrect) {
                try {
                    const curQ = userPkQuestions[currentUserPkQuestionIndex];
                    if (curQ) await saveWrongWord(curQ);
                } catch (e) { console.error(e); }
            }
            
            document.querySelectorAll('#user-pk-options .option-btn').forEach(btn => {
                btn.disabled = true;
                if (btn.dataset.correct === 'true') {
                    btn.classList.add('correct');
                }
            });
            
            userPkSharedRemainingTime = 0;
            document.getElementById('user-pk-timer').textContent = `? 本题剩余：0秒`;
            
            try {
                const response = await fetch(`/api/pk/rooms/${currentRoom.id}/answer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        questionIndex: currentUserPkQuestionIndex,
                        isCorrect: isCorrect
                    })
                });
                const data = await response.json();
                console.log('[PK] answer response:', data);
                
                if (response.ok) {
                    if (data.scores && data.scores[currentUser.id] !== undefined) {
                        userPkScore1 = data.scores[currentUser.id];
                    }
                    document.getElementById('user-pk-score1').textContent = userPkScore1;
                    
                    if (isTimeout) {
                        userResult1.innerHTML = '<span class="text-warning">? 超时</span>';
                    } else if (isCorrect) {
                        userResult1.innerHTML = '<span class="text-success">? 抢答正确 +1分</span>';
                    } else {
                        userResult1.innerHTML = '<span class="text-danger">? 抢答错误</span>';
                    }
                    
                    // 抢答正确立即结算并进入下一题
                    // 抢答错误：如果是最后选项则等对方答完
                    if (isCorrect || data.bothAnswered || data.autoAdvanced) {
                        if (userPkSyncInterval) {
                            clearInterval(userPkSyncInterval);
                            userPkSyncInterval = null;
                        }
                        await settlePkQuestion(data);
                    } else {
                        const userResult2 = document.getElementById('user-pk-result2');
                        userResult2.innerHTML = '<span class="text-muted">等待对手作答...</span>';
                    }
                } else {
                    console.error('提交失败:', data.message);
                }
            } catch (error) {
                console.error('提交答案失败:', error);
            } finally {
                window.__pkAnswering = false;
            }
        }
        
        async function settlePkQuestion(serverData) {
            console.log('[PK] settlePkQuestion called, __pkSettled=', window.__pkSettled, 'data=', serverData);
            if (window.__pkSettled) return;
            window.__pkSettled = true;
            
            try {
                let data = serverData;
                if (!data.answers || !data.scores) {
                    const resp = await fetch(`/api/pk/rooms/${currentRoom.id}/game`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (resp.ok) data = await resp.json();
                }
                
                // Use the question index that was answered, not the current (possibly advanced) one
                const qIdx = serverData.questionIndex !== undefined ? serverData.questionIndex : currentUserPkQuestionIndex;
                const userResult1 = document.getElementById('user-pk-result1');
                const userResult2 = document.getElementById('user-pk-result2');
                
                console.log('[PK] settle: using answered qIdx=', qIdx, 'answers=', data.answers);
                
                if (userPkOpponent && data.answers && data.answers[userPkOpponent.id]) {
                    const opponentAnswer = data.answers[userPkOpponent.id][qIdx];
                    if (opponentAnswer === undefined) {
                        userResult2.innerHTML = '<span class="text-muted">对手未答</span>';
                    } else if (opponentAnswer === true) {
                        userResult2.innerHTML = '<span class="text-success">? 对手答对 +1分</span>';
                    } else {
                        userResult2.innerHTML = '<span class="text-danger">? 对手答错</span>';
                    }
                }
                
                userPkScore1 = data.scores[currentUser.id] || 0;
                userPkScore2 = (userPkOpponent && data.scores[userPkOpponent.id] !== undefined) ? data.scores[userPkOpponent.id] : 0;
                document.getElementById('user-pk-score1').textContent = userPkScore1;
                document.getElementById('user-pk-score2').textContent = userPkScore2;
                
                const isLast = serverData.isLastQuestion || qIdx >= (userPkQuestions.length - 1);
                console.log('[PK] settle: isLast=', isLast, 'scheduling goToNextQuestion in 1.8s');
                
                window.__pkAdvancing = true;
                setTimeout(async () => {
                    console.log('[PK] settle: timeout fired, __pkAdvancing=', window.__pkAdvancing, 'isLast=', isLast);
                    if (isLast) {
                        showUserPkResult();
                    } else {
                        await goToNextQuestion();
                    }
                    window.__pkAdvancing = false;
                    window.__pkSettled = false;
                }, 1800);
            } catch (error) {
                console.error('[PK] 结算失败:', error);
                window.__pkAdvancing = false;
                window.__pkSettled = false;
            }
        }
        
        async function goToNextQuestion() {
            console.log('[PK] goToNextQuestion called, current qIdx=', currentUserPkQuestionIndex);
            try {
                const nextResp = await fetch(`/api/pk/rooms/${currentRoom.id}/next`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ clientQuestionIndex: currentUserPkQuestionIndex })
                });
                const nextData = await nextResp.json();
                console.log('[PK] /next response:', nextData);
                
                if (nextData.isFinished) {
                    showUserPkResult();
                    return;
                }
                
                window.__pkIAnswered = false;
                window.__pkAnswering = false;
                window.__pkSettled = false;
                window.__pkSettling = false;
                window.__pkAdvancing = false;
                
                showUserPkQuestion();
            } catch (error) {
                console.error('[PK] 进入下一题失败:', error);
                window.__pkAdvancing = false;
                window.__pkSettled = false;
            }
        }
        
        function showUserPkResult() {
            if (userPkTimerInterval) clearInterval(userPkTimerInterval);
            if (userPkSyncInterval) clearInterval(userPkSyncInterval);
            userPkTimerInterval = null;
            userPkSyncInterval = null;
            
            document.getElementById('user-pk-arena').classList.add('d-none');
            document.getElementById('user-pk-result').classList.remove('d-none');
            
            document.getElementById('final-score1').textContent = userPkScore1;
            document.getElementById('final-score2').textContent = userPkScore2;
            
            const winnerText = document.getElementById('pk-winner');
            if (userPkScore1 > userPkScore2) {
                winnerText.innerHTML = '?? 恭喜你获胜！';
                winnerText.className = 'text-success text-lg font-bold mb-4';
            } else if (userPkScore1 < userPkScore2) {
                winnerText.innerHTML = '很遗憾，你输了';
                winnerText.className = 'text-danger text-lg font-bold mb-4';
            } else {
                winnerText.innerHTML = '平局！';
                winnerText.className = 'text-warning text-lg font-bold mb-4';
            }
        }
        
        // 生成测试题目
        function generateTestQuestions() {
            testQuestions = [];
            
            // 按照分布生成题目
            wordDistribution.forEach(item => {
                const { level, difficulty, count } = item;
                const words = wordData[level];
                
                // 根据难度划分词汇
                const totalWords = words.length;
                const chunkSize = Math.ceil(totalWords / 3);
                let startIndex, endIndex;
                
                switch (difficulty) {
                    case 1:
                        startIndex = 0;
                        endIndex = chunkSize;
                        break;
                    case 2:
                        startIndex = chunkSize;
                        endIndex = chunkSize * 2;
                        break;
                    case 3:
                        startIndex = chunkSize * 2;
                        endIndex = totalWords;
                        break;
                }
                
                // 随机选择指定数量的单词
                const availableWords = words.slice(startIndex, endIndex);
                const selectedWords = [];
                
                while (selectedWords.length < count && availableWords.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableWords.length);
                    selectedWords.push(availableWords[randomIndex]);
                    availableWords.splice(randomIndex, 1);
                }
                
                // 为每个单词生成题目
                selectedWords.forEach(word => {
                    testQuestions.push({
                        ...word,
                        level,
                        difficulty
                    });
                });
            });
            
            console.log('Test questions generated:', testQuestions.length);
        }

        // 生成干扰选项
        function generateDistractors(correctMeaning, level) {
            const distractors = [];
            const allWords = wordData[level];
            
            // 随机选择4个不同的释义作为干扰选项
            while (distractors.length < 4) {
                const randomIndex = Math.floor(Math.random() * allWords.length);
                const distractor = allWords[randomIndex].meaning;
                
                if (distractor !== correctMeaning && !distractors.includes(distractor)) {
                    distractors.push(distractor);
                }
            }
            
            return distractors;
        }

        // 显示当前题目
        function showCurrentQuestion() {
            const question = testQuestions[currentQuestionIndex];
            document.getElementById('question-number').textContent = currentQuestionIndex + 1;
            document.getElementById('word').textContent = question.word;
            document.getElementById('phonetic').textContent = question.phonetic;
            
            // 生成选项
            const correctMeaning = question.meaning;
            const distractors = generateDistractors(correctMeaning, question.level);
            const options = [correctMeaning, ...distractors, '不认识'];
            
            // 打乱选项顺序（但不认识固定在最后）
            for (let i = options.length - 2; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }
            
            // 显示选项
            const optionsContainer = document.getElementById('options');
            optionsContainer.innerHTML = '';
            
            options.forEach((option, index) => {
                const button = document.createElement('button');
                button.className = 'option-btn';
                button.textContent = option;
                button.dataset.index = index;
                button.dataset.correct = option === correctMeaning;
                
                button.addEventListener('click', function() {
                    // 移除其他选项的选中状态
                    document.querySelectorAll('.option-btn').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    
                    // 添加当前选项的选中状态
                    this.classList.add('selected');
                    
                    // 显示下一题按钮
                    document.getElementById('next-btn').classList.remove('d-none');
                });
                
                optionsContainer.appendChild(button);
            });
            
            // 更新进度条
            const progress = ((currentQuestionIndex + 1) / testQuestions.length) * 100;
            const progressBar = document.querySelector('.progress-bar');
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${currentQuestionIndex + 1}/${testQuestions.length}`;
            progressBar.setAttribute('aria-valuenow', currentQuestionIndex + 1);
        }

        // 检查答案
        function checkAnswer() {
            const selectedButton = document.querySelector('.option-btn.selected');
            if (!selectedButton) return false;
            
            const isCorrect = selectedButton.dataset.correct === 'true';
            const isUnknown = selectedButton.textContent === '不认识';
            
            // 更新统计信息
            if (isCorrect) {
                correctCount++;
                consecutiveIncorrect = 0;
                
                // 更新各阶段正确数
                const question = testQuestions[currentQuestionIndex];
                if (question.level === 'primary') {
                    primaryCorrect++;
                } else if (question.level === 'middle') {
                    middleCorrect++;
                } else if (question.level === 'high') {
                    highCorrect++;
                }
            } else if (!isUnknown) {
                consecutiveIncorrect++;
                totalIncorrect++;
                // 保存错题
                saveWrongWord(testQuestions[currentQuestionIndex]);
            } else {
                // 不认识，算作答错
                consecutiveIncorrect++;
                totalIncorrect++;
                // 保存错题
                saveWrongWord(testQuestions[currentQuestionIndex]);
            }
            
            // 标记选项
            document.querySelectorAll('.option-btn').forEach(btn => {
                if (btn.dataset.correct === 'true') {
                    btn.classList.add('correct');
                } else if (btn === selectedButton && !isCorrect) {
                    btn.classList.add('incorrect');
                }
                btn.disabled = true;
            });
            
            return true;
        }

        // 计算词汇量
        function calculateVocabulary() {
            // 计算各阶段掌握率
            const primaryTotal = 4 + 6 + 6; // 小学总题数
            const middleTotal = 6 + 6 + 6;  // 初中总题数
            const highTotal = 6 + 6 + 4;    // 高中总题数
            
            const primaryRate = primaryTotal > 0 ? primaryCorrect / primaryTotal : 0;
            const middleRate = middleTotal > 0 ? middleCorrect / middleTotal : 0;
            const highRate = highTotal > 0 ? highCorrect / highTotal : 0;
            
            // 计算词汇量
            const primaryVocab = primaryRate * 1000 * 1.25;
            const middleVocab = middleRate * 2500 * 1.1;
            const highVocab = highRate * 3500 * 1.1;
            
            const totalVocab = Math.round(primaryVocab + middleVocab + highVocab);
            
            return {
                total: totalVocab,
                primary: {
                    correct: primaryCorrect,
                    total: primaryTotal,
                    rate: primaryRate
                },
                middle: {
                    correct: middleCorrect,
                    total: middleTotal,
                    rate: middleRate
                },
                high: {
                    correct: highCorrect,
                    total: highTotal,
                    rate: highRate
                }
            };
        }

        // 评估水平
        function evaluateLevel() {
            if (correctCount <= 10) {
                return '入门级';
            } else if (correctCount <= 20) {
                return '小学水平';
            } else if (correctCount <= 30) {
                return '初中水平';
            } else if (correctCount <= 40) {
                return '高中水平';
            } else {
                return '优秀水平';
            }
        }

        // 显示结果
        function showResult() {
            const vocabulary = calculateVocabulary();
            const level = evaluateLevel();
            
            // 显示结果页面
            document.getElementById('test-page').classList.add('d-none');
            document.getElementById('result-page').classList.remove('d-none');
            
            // 填充结果数据
            document.getElementById('level').textContent = level;
            document.getElementById('vocabulary-count').textContent = vocabulary.total;
            document.getElementById('correct-count').textContent = correctCount;
            document.getElementById('consecutive-incorrect').textContent = consecutiveIncorrect;
            document.getElementById('total-incorrect').textContent = totalIncorrect;
            
            // 显示结束原因
            const endReasonDiv = document.getElementById('end-reason');
            if (consecutiveIncorrect >= 4) {
                endReasonDiv.textContent = '测评因连续答错4题提前结束';
                endReasonDiv.className = 'text-center mb-4 text-danger small';
            } else if (totalIncorrect >= 7) {
                endReasonDiv.textContent = '测评因累计答错7题提前结束';
                endReasonDiv.className = 'text-center mb-4 text-warning small';
            } else {
                endReasonDiv.textContent = '完成全部50题测评';
                endReasonDiv.className = 'text-center mb-4 text-success small';
            }
            
            // 更新进度条
            const primaryProgress = vocabulary.primary.rate * 100;
            const middleProgress = vocabulary.middle.rate * 100;
            const highProgress = vocabulary.high.rate * 100;
            
            const primaryBar = document.getElementById('primary-progress');
            primaryBar.style.width = `${primaryProgress}%`;
            primaryBar.textContent = `小学：${Math.round(primaryProgress)}%`;
            primaryBar.setAttribute('aria-valuenow', primaryProgress);
            
            const middleBar = document.getElementById('middle-progress');
            middleBar.style.width = `${middleProgress}%`;
            middleBar.textContent = `初中：${Math.round(middleProgress)}%`;
            middleBar.setAttribute('aria-valuenow', middleProgress);
            
            const highBar = document.getElementById('high-progress');
            highBar.style.width = `${highProgress}%`;
            highBar.textContent = `高中：${Math.round(highProgress)}%`;
            highBar.setAttribute('aria-valuenow', highProgress);
        }

        // 检查是否达到结束条件
        function checkEndCondition() {
            return currentQuestionIndex >= testQuestions.length - 1 || 
                   consecutiveIncorrect >= 4 || 
                   totalIncorrect >= 7;
        }

        // 初始化应用
        function init() {
            loadWordData();
            restoreLoginState();
            
            // 等待DOM完全加载后再绑定事件监听器
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initEventListeners);
            } else {
                initEventListeners();
            }
        }

        // 安全添加事件监听器
        function safeAddListener(elementId, event, handler) {
            const el = document.getElementById(elementId);
            if (el) {
                el.addEventListener(event, handler);
            }
        }

        // 初始化事件监听
        function initEventListeners() {
            // 开始测评按钮
            safeAddListener('start-test', 'click', function() {
                generateTestQuestions();
                currentQuestionIndex = 0;
                correctCount = 0;
                consecutiveIncorrect = 0;
                totalIncorrect = 0;
                primaryCorrect = 0;
                middleCorrect = 0;
                highCorrect = 0;
                
                document.getElementById('start-page').classList.add('d-none');
                document.getElementById('test-page').classList.remove('d-none');
                showCurrentQuestion();
            });
            
            // 下一题按钮
            safeAddListener('next-btn', 'click', function() {
                if (checkAnswer()) {
                    currentQuestionIndex++;
                    
                    if (checkEndCondition()) {
                        showResult();
                    } else {
                        showCurrentQuestion();
                        this.classList.add('d-none');
                    }
                }
            });
            
            // 重新测评按钮
            safeAddListener('restart-test', 'click', function() {
                document.getElementById('result-page').classList.add('d-none');
                document.getElementById('start-page').classList.remove('d-none');
            });

            // 登录表单提交
            safeAddListener('login-form', 'submit', async function(e) {
                e.preventDefault();
                const username = document.getElementById('login-username').value;
                const password = document.getElementById('login-password').value;

                try {
                    const response = await fetch('/api/users/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ username, password })
                    });

                    const data = await response.json();
                    if (response.ok) {
                        currentUser = data.user;
                        token = data.token;
                        localStorage.setItem('token', token);
                        localStorage.setItem('user', JSON.stringify(currentUser));
                        alert('登录成功');
                        showPage('start-page');
                        // 修改首页提示信息为个人中心
                        updateStartPageInfo();
                        // 更新按钮显示
                        const loginBtn2 = document.getElementById('login-btn');
                        const profileBtn2 = document.getElementById('profile-btn');
                        if (loginBtn2) loginBtn2.classList.add('d-none');
                        if (profileBtn2) profileBtn2.classList.remove('d-none');
                        // 显示用户信息及管理员后台按钮
                        const userInfoDiv = document.getElementById('user-info');
                        if (userInfoDiv) {
                            userInfoDiv.innerHTML = `
                                <p><strong>用户名：</strong>${currentUser.username}</p>
                                <p><strong>角色：</strong>${currentUser.role === 'admin' ? '管理员' : '普通用户'}</p>
                            `;
                        }
                        const toAdminBtn = document.getElementById('to-admin');
                        if (toAdminBtn) {
                            if (currentUser.role === 'admin') {
                                toAdminBtn.style.display = 'inline-block';
                            } else {
                                toAdminBtn.style.display = 'none';
                            }
                        }
                    } else {
                        alert(data.message);
                    }
                } catch (error) {
                    console.error('登录失败:', error);
                    alert('登录失败，请稍后重试');
                }
            });

            // 注册表单提交
            safeAddListener('register-form', 'submit', async function(e) {
                e.preventDefault();
                const username = document.getElementById('register-username').value;
                const password = document.getElementById('register-password').value;

                try {
                    const response = await fetch('/api/users/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ username, password })
                    });

                    const data = await response.json();
                    if (response.ok) {
                        alert('注册成功，请登录');
                        showPage('login-page');
                    } else {
                        alert(data.message);
                    }
                } catch (error) {
                    console.error('注册失败:', error);
                    alert('注册失败，请稍后重试');
                }
            });

            // 个人中心按钮点击事件
            document.getElementById('profile-btn')?.addEventListener('click', function() {
                showPage('profile-page');
                loadUserProfile();
            });

            safeAddListener('to-register', 'click', function(e) {
                e.preventDefault();
                showPage('register-page');
            });

            safeAddListener('to-login', 'click', function(e) {
                e.preventDefault();
                showPage('login-page');
            });

            safeAddListener('back-to-start', 'click', function(e) {
                e.preventDefault();
                showPage('start-page');
            });

            safeAddListener('back-to-start2', 'click', function(e) {
                e.preventDefault();
                showPage('start-page');
            });

            safeAddListener('to-profile', 'click', function() {
                if (currentUser) {
                    showPage('profile-page');
                    loadUserProfile();
                } else {
                    showPage('login-page');
                }
            });

            safeAddListener('back-from-profile', 'click', function() {
                showPage('start-page');
            });

            safeAddListener('logout-btn', 'click', function() {
                currentUser = null;
                token = null;
                wrongWords = [];
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                alert('退出登录成功');
                showPage('start-page');
                resetStartPageInfo();
                // 恢复按钮显示
                const loginBtn3 = document.getElementById('login-btn');
                const profileBtn3 = document.getElementById('profile-btn');
                if (loginBtn3) loginBtn3.classList.remove('d-none');
                if (profileBtn3) profileBtn3.classList.add('d-none');
            });

            // 个人中心标签页切换
            document.querySelectorAll('#profile-page .nav-link').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    document.querySelectorAll('#profile-page .nav-link').forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                    document.getElementById('profile-records').classList.add('d-none');
                    document.getElementById('profile-chart').classList.add('d-none');
                    document.getElementById('profile-wrong').classList.add('d-none');
                    document.getElementById(this.dataset.target).classList.remove('d-none');
                    
                    if (this.dataset.target === 'profile-chart') {
                        drawVocabularyChart();
                    } else if (this.dataset.target === 'profile-wrong') {
                        loadWrongWords();
                    }
                });
            });

            // 管理员后台相关事件
            safeAddListener('to-admin', 'click', function() {
                console.log('管理员后台按钮被点击');
                console.log('当前用户:', currentUser);
                if (currentUser && currentUser.role === 'admin') {
                    console.log('用户是管理员，跳转到管理员后台');
                    showPage('admin-page');
                    loadUserList();
                } else {
                    console.log('权限不足');
                    alert('权限不足，需要管理员权限');
                }
            });

            safeAddListener('back-from-admin', 'click', function() {
                showPage('profile-page');
            });

            // 管理员后台标签页切换
            document.querySelectorAll('#admin-page .nav-link').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    // 移除所有标签页的active类
                    document.querySelectorAll('#admin-page .nav-link').forEach(l => l.classList.remove('active'));
                    // 添加当前标签页的active类
                    this.classList.add('active');
                    // 隐藏所有内容
                    document.getElementById('user-management').classList.add('d-none');
                    document.getElementById('word-management').classList.add('d-none');
                    document.getElementById('test-management').classList.add('d-none');
                    // 显示当前内容
                    document.getElementById(this.dataset.target).classList.remove('d-none');
                    // 如果切换到用户管理，加载用户列表
                    if (this.dataset.target === 'user-management') {
                        loadUserList();
                    }
                    // 如果切换到测试记录，加载所有测试记录
                    if (this.dataset.target === 'test-management') {
                        loadAllTestRecords();
                    }
                });
            });

            // 加载单词列表
            safeAddListener('load-words', 'click', function() {
                const stage = document.getElementById('word-stage').value;
                const level = document.getElementById('word-level').value;
                loadWordList(stage, level);
            });

            // 添加单词表单提交
            safeAddListener('add-word-form', 'submit', async function(e) {
                e.preventDefault();
                const word = document.getElementById('new-word').value;
                const meaning = document.getElementById('new-meaning').value;
                const phonetic = document.getElementById('new-phonetic').value;
                const stage = document.getElementById('word-stage').value;
                const level = document.getElementById('word-level').value;

                try {
                    const response = await fetch('/api/words', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ word, meaning, phonetic, stage, level: parseInt(level) })
                    });

                    const data = await response.json();
                    if (response.ok) {
                        alert('单词添加成功');
                        // 重置表单
                        this.reset();
                        // 重新加载单词列表
                        loadWordList(stage, level);
                    } else {
                        alert(data.message);
                    }
                } catch (error) {
                    console.error('添加单词失败:', error);
                    alert('添加单词失败，请稍后重试');
                }
            });
            
            // 开始AI单词PK按钮（已移至PK选择页面）
            const startPkBtn = document.getElementById('start-pk');
            if (startPkBtn) {
                startPkBtn.addEventListener('click', startAiPk);
            }
            

            // PK重新开始按钮
            safeAddListener('pk-restart-btn', 'click', function() {
                generatePkQuestions();
                currentPkQuestionIndex = 0;
                userScore = 0;
                aiScore = 0;
                
                // 重置分数显示
                document.getElementById('user-score').textContent = userScore;
                document.getElementById('ai-score').textContent = aiScore;
                
                // 隐藏重新开始按钮，显示下一题按钮
                this.classList.add('d-none');
                document.getElementById('pk-next-btn').classList.add('d-none');
                
                showCurrentPkQuestion();
            });
            
            // PK返回首页按钮
            safeAddListener('pk-back-btn', 'click', function() {
                document.getElementById('pk-page').classList.add('d-none');
                document.getElementById('start-page').classList.remove('d-none');
            });
            
            // 用户PK按钮
            safeAddListener('start-user-pk', 'click', function() {
                if (!currentUser) {
                    alert('请先登录后再进行用户PK');
                    showPage('login-page');
                    return;
                }
                document.getElementById('user-pk-arena').classList.add('d-none');
                document.getElementById('user-pk-result').classList.add('d-none');
                document.getElementById('user-pk-rooms').classList.remove('d-none');
                showPage('user-pk-page');
                loadPKRooms();
            });
            
            // 创建房间按钮
            safeAddListener('create-room-btn', 'click', function() {
                createRoom();
            });
            
            // 用户PK房间列表返回首页按钮
            safeAddListener('user-pk-back-home-btn', 'click', function() {
                if (roomRefreshInterval) {
                    clearInterval(roomRefreshInterval);
                    roomRefreshInterval = null;
                }
                currentRoom = null;
                showPage('start-page');
            });
            
            // 用户PK返回首页按钮
            safeAddListener('user-pk-back-btn', 'click', function() {
                document.getElementById('user-pk-page').classList.add('d-none');
                document.getElementById('user-pk-arena').classList.add('d-none');
                document.getElementById('user-pk-rooms').classList.remove('d-none');
                document.getElementById('user-pk-result').classList.add('d-none');
                currentRoom = null;
                showPage('start-page');
            });
            
            // 用户PK下一题按钮 - 现在是自动进入下一题，不需要点击
            
            // 用户PK完成按钮
            safeAddListener('user-pk-finish-btn', 'click', function() {
                showUserPkResult();
            });
            
            // 用户PK再来一局按钮
            safeAddListener('user-pk-restart-btn', 'click', async function() {
                try {
                    const response = await fetch(`/api/pk/rooms/${currentRoom.id}/restart`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    const data = await response.json();
                    if (response.ok) {
                        // 重新开始游戏
                        currentRoom = data.room;
                        // 重新获取题目
                        await startUserPKGame();
                    } else {
                        alert(data.message || '重新开始失败');
                    }
                } catch (error) {
                    console.error('重新开始失败:', error);
                    alert('重新开始失败');
                }
            });
            
            // 用户PK返回首页按钮（结果页）
            safeAddListener('user-pk-back-home', 'click', function() {
                document.getElementById('user-pk-result').classList.add('d-none');
                showPage('start-page');
            });
        }

        // 保存测评记录
        async function saveTestRecord(score, vocabulary, level) {
            if (!token) return;

            try {
                const response = await fetch('/api/tests', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ score, vocabulary, level })
                });

                const data = await response.json();
                if (response.ok) {
                    console.log('测评记录保存成功');
                    
                    // 将新记录添加到 testHistoryData 数组，以便图表能显示最新数据
                    if (data.record) {
                        testHistoryData.unshift(data.record);
                    }
                } else {
                    console.error('保存测评记录失败:', data.message);
                }
            } catch (error) {
                console.error('保存测评记录失败:', error);
            }
        }

            // 使用事件委托绑定底部导航栏点击事件
            document.addEventListener('click', function(e) {
                const target = e.target;
                
                // 检查是否点击了测评按钮或其子元素
                const navTest = document.getElementById('nav-test');
                if (navTest && (target === navTest || navTest.contains(target))) {
                    if (!currentUser) {
                        showPage('login-page');
                        return;
                    }
                    showPage('start-page');
                    updateBottomNav('nav-test');
                    return;
                }
                
                // 检查是否点击了PK按钮或其子元素
                const navPk = document.getElementById('nav-pk');
                if (navPk && (target === navPk || navPk.contains(target))) {
                    if (!currentUser) {
                        showPage('login-page');
                        return;
                    }
                    showPage('pk-select-page');
                    updateBottomNav('nav-pk');
                    return;
                }
                
                // 检查是否点击了个人中心按钮或其子元素
                const navProfile = document.getElementById('nav-profile');
                if (navProfile && (target === navProfile || navProfile.contains(target))) {
                    if (!currentUser) {
                        showPage('login-page');
                        return;
                    }
                    showPage('profile-page');
                    loadUserProfile();
                    updateBottomNav('nav-profile');
                    return;
                }
            });

        // 加载用户个人信息和历史测评记录
        
        // 保存错题
        function saveWrongWord(question) {
            const key = currentUser ? `wrong_words_${currentUser.id}` : 'wrong_words_guest';
            let existingWords = JSON.parse(localStorage.getItem(key) || '[]');
            
            console.log('保存错题:', question.word, '到key:', key, '当前已有:', existingWords.length);
            
            // 检查是否已存在
            if (!existingWords.find(w => w.word === question.word)) {
                existingWords.push({
                    word: question.word,
                    meaning: question.meaning,
                    phonetic: question.phonetic,
                    level: question.level,
                    wrongTime: new Date().toISOString()
                });
                localStorage.setItem(key, JSON.stringify(existingWords));
                console.log('错题已保存，当前总数:', existingWords.length);
            } else {
                console.log('错题已存在，跳过保存');
            }
        }
        
        // 加载错题列表
        function loadWrongWords() {
            const key = currentUser ? `wrong_words_${currentUser.id}` : 'wrong_words_guest';
            const words = JSON.parse(localStorage.getItem(key) || '[]');
            
            console.log('加载错题列表，从key:', key, '加载到', words.length, '个错题');
            
            const listDiv = document.getElementById('wrong-words-list');
            const countBadge = document.getElementById('wrong-count');
            
            countBadge.textContent = words.length;
            
            if (words.length === 0) {
                listDiv.innerHTML = '<p class="text-muted">暂无错题记录，继续保持！</p>';
                return;
            }
            
            let html = '<table class="table table-sm table-striped">';
            html += '<thead><tr><th>单词</th><th>音标</th><th>释义</th><th>难度</th></tr></thead><tbody>';
            
            words.forEach(w => {
                const levelText = w.level === 'primary' ? '小学' : w.level === 'middle' ? '初中' : '高中';
                const levelClass = w.level === 'primary' ? 'success' : w.level === 'middle' ? 'warning' : 'danger';
                html += `<tr>
                    <td><strong>${w.word}</strong></td>
                    <td>${w.phonetic || '-'}</td>
                    <td>${w.meaning}</td>
                    <td><span class="badge bg-${levelClass}">${levelText}</span></td>
                </tr>`;
            });
            
            html += '</tbody></table>';
            listDiv.innerHTML = html;
        }
        
        // 清空错题本
        document.addEventListener('click', function(e) {
            if (e.target && e.target.id === 'clear-wrong-btn') {
                if (confirm('确定要清空所有错题记录吗？')) {
                    const key = currentUser ? `wrong_words_${currentUser.id}` : 'wrong_words_guest';
                    localStorage.removeItem(key);
                    loadWrongWords();
                    alert('错题本已清空');
                }
            }
        });
        
        // 复习错题相关变量
        let reviewWords = [];
        let currentReviewIndex = 0;
        let reviewCorrectCount = 0;
        
        // 开始复习错题
        safeAddListener('review-wrong-btn', 'click', function() {
            const key = currentUser ? `wrong_words_${currentUser.id}` : 'wrong_words_guest';
            const words = JSON.parse(localStorage.getItem(key) || '[]');
            
            if (words.length === 0) {
                alert('暂无错题记录！');
                return;
            }
            
            reviewWords = [...words];
            currentReviewIndex = 0;
            reviewCorrectCount = 0;
            
            // 隐藏错题列表，显示复习模式
            document.getElementById('wrong-words-list').classList.add('d-none');
            document.getElementById('review-wrong-btn').classList.add('d-none');
            document.getElementById('clear-wrong-btn').classList.add('d-none');
            document.getElementById('review-mode').classList.remove('d-none');
            
            showReviewQuestion();
        });
        
        // 显示复习题目（填空补全单词模式）
        function showReviewQuestion() {
            if (currentReviewIndex >= reviewWords.length) {
                finishReview();
                return;
            }
            
            const word = reviewWords[currentReviewIndex];
            
            document.getElementById('review-current').textContent = currentReviewIndex + 1;
            document.getElementById('review-total').textContent = reviewWords.length;
            document.getElementById('review-score').textContent = `得分: ${reviewCorrectCount}`;
            
            // 显示释义
            document.getElementById('review-meaning').textContent = word.meaning;
            
            // 生成填空显示（隐藏部分字母）
            const blankWord = generateBlankWord(word.word);
            document.getElementById('review-blank').textContent = blankWord;
            
            // 显示音标作为提示
            document.getElementById('review-hint').textContent = `提示：${word.phonetic || '无音标'}`;
            document.getElementById('review-hint').classList.remove('d-none');
            
            // 清空输入框和结果
            document.getElementById('review-input').value = '';
            document.getElementById('review-result').innerHTML = '';
            
            // 显示提交按钮，隐藏其他按钮
            document.getElementById('review-submit').classList.remove('d-none');
            document.getElementById('review-show-answer').classList.remove('d-none');
            document.getElementById('review-finish').classList.add('d-none');
            
            // 聚焦输入框
            document.getElementById('review-input').focus();
        }
        
        // 生成填空单词（隐藏一半字母）
        function generateBlankWord(word) {
            if (word.length <= 3) {
                // 短单词只显示首字母
                return word[0] + '_'.repeat(word.length - 1);
            } else if (word.length <= 5) {
                // 中等长度显示首字母和尾字母
                return word[0] + '_'.repeat(word.length - 2) + word[word.length - 1];
            } else {
                // 长单词显示首字母和部分中间字母
                const half = Math.floor(word.length / 2);
                let result = word[0];
                for (let i = 1; i < word.length - 1; i++) {
                    if (i < half) {
                        result += '_';
                    } else {
                        result += word[i];
                    }
                }
                result += word[word.length - 1];
                return result;
            }
        }
        
        // 提交答案
        safeAddListener('review-submit', 'click', function() {
            const userAnswer = document.getElementById('review-input').value.trim().toLowerCase();
            const correctAnswer = reviewWords[currentReviewIndex].word.toLowerCase();
            
            const resultDiv = document.getElementById('review-result');
            const word = reviewWords[currentReviewIndex];
            
            if (userAnswer === correctAnswer) {
                resultDiv.innerHTML = `<span class="text-success">? 回答正确！该单词已从错题本中移除</span>`;
                reviewCorrectCount++;
                document.getElementById('review-score').textContent = `得分: ${reviewCorrectCount}`;
                
                // 从错题本中移除正确回答的单词
                removeFromWrongWords(word.word);
            } else {
                resultDiv.innerHTML = `<span class="text-danger">? 回答错误！正确答案：<strong>${word.word}</strong></span>`;
            }
            
            // 隐藏提交和显示答案按钮
            document.getElementById('review-submit').classList.add('d-none');
            document.getElementById('review-show-answer').classList.add('d-none');
            
            // 延迟1秒后进入下一题
            setTimeout(() => {
                currentReviewIndex++;
                showReviewQuestion();
            }, 1500);
        });
        
        // 显示答案
        safeAddListener('review-show-answer', 'click', function() {
            const word = reviewWords[currentReviewIndex];
            const resultDiv = document.getElementById('review-result');
            
            resultDiv.innerHTML = `<span class="text-warning">正确答案：<strong>${word.word}</strong></span>`;
            
            // 隐藏提交和显示答案按钮
            document.getElementById('review-submit').classList.add('d-none');
            document.getElementById('review-show-answer').classList.add('d-none');
            
            // 延迟1秒后进入下一题
            setTimeout(() => {
                currentReviewIndex++;
                showReviewQuestion();
            }, 1500);
        });
        
        // 从错题本中移除单词
        function removeFromWrongWords(wordToRemove) {
            const key = currentUser ? `wrong_words_${currentUser.id}` : 'wrong_words_guest';
            const words = JSON.parse(localStorage.getItem(key) || '[]');
            const filtered = words.filter(w => w.word !== wordToRemove);
            localStorage.setItem(key, JSON.stringify(filtered));
        }
        
        // 完成复习
        function finishReview() {
            const resultDiv = document.getElementById('review-result');
            const message = document.getElementById('review-message');
            
            message.textContent = `复习完成！共 ${reviewWords.length} 题，答对 ${reviewCorrectCount} 题，${reviewWords.length - reviewCorrectCount} 题仍需复习`;
            message.className = 'text-primary';
            resultDiv.classList.remove('d-none');
            
            document.getElementById('review-finish').classList.remove('d-none');
        }
        
        // 退出复习模式
        safeAddListener('review-finish', 'click', function() {
            // 重新加载错题列表
            loadWrongWords();
            
            // 显示错题列表，隐藏复习模式
            document.getElementById('wrong-words-list').classList.remove('d-none');
            document.getElementById('review-wrong-btn').classList.remove('d-none');
            document.getElementById('clear-wrong-btn').classList.remove('d-none');
            document.getElementById('review-mode').classList.add('d-none');
        });
        
        // 绘制词汇量变化折线图
        function drawVocabularyChart() {
            const ctx = document.getElementById('vocabulary-chart').getContext('2d');
            
            if (!testHistoryData || testHistoryData.length === 0) {
                document.getElementById('vocabulary-chart-container').innerHTML = '<p class="text-muted text-center py-4">暂无测评记录，请先完成一次测评</p>';
                return;
            }
            
            const labels = testHistoryData.map(record => {
                const date = new Date(record.createdAt);
                return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            });
            
            const vocabularyData = testHistoryData.map(record => record.vocabulary);
            const scoreData = testHistoryData.map(record => record.score);
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: '词汇量',
                            data: vocabularyData,
                            borderColor: 'rgb(54, 162, 235)',
                            backgroundColor: 'rgba(54, 162, 235, 0.1)',
                            tension: 0.3,
                            fill: true,
                            yAxisID: 'y'
                        },
                        {
                            label: '答对题数',
                            data: scoreData,
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.1)',
                            tension: 0.3,
                            fill: true,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            type: 'linear',
                            position: 'left',
                            title: {
                                display: true,
                                text: '词汇量'
                            },
                            beginAtZero: true
                        },
                        y1: {
                            type: 'linear',
                            position: 'right',
                            title: {
                                display: true,
                                text: '答对题数'
                            },
                            beginAtZero: true,
                            max: 50
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    }
                }
            });
        }
        
        async function loadUserProfile() {
            if (!token) {
                const userInfoDiv = document.getElementById('user-info');
                if (userInfoDiv) {
                    userInfoDiv.innerHTML = '<p class="text-danger">请先登录查看个人信息</p>';
                }
                const testRecordsDiv = document.getElementById('test-records');
                if (testRecordsDiv) {
                    testRecordsDiv.innerHTML = '<p class="text-danger">请先登录查看历史记录</p>';
                }
                return;
            }

            try {
                // 更新用户名显示
                const profileUsername = document.getElementById('profile-username');
                if (profileUsername) {
                    profileUsername.textContent = currentUser.username;
                }

                // 显示用户信息
                const userInfoDiv = document.getElementById('user-info');
                if (userInfoDiv) {
                    userInfoDiv.innerHTML = `
                        <p><strong>用户名：</strong>${currentUser.username}</p>
                        <p><strong>角色：</strong>${currentUser.role === 'admin' ? '管理员' : '普通用户'}</p>
                    `;
                }

                // 如果是管理员，显示管理员后台按钮
                if (currentUser.role === 'admin') {
                    document.getElementById('to-admin').style.display = 'inline-block';
                } else {
                    document.getElementById('to-admin').style.display = 'none';
                }

                // 加载错题本
                loadWrongWords();

                // 获取历史测评记录
                const response = await fetch('/api/tests/history', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();
                if (response.ok) {
                    console.log('历史记录加载成功:', data.records);
                    // 保存历史记录数据用于绘制图表
                    testHistoryData = data.records || [];
                    
                    // 更新统计数据
                    const records = data.records || [];
                    const statTests = document.getElementById('stat-tests');
                    const statVocabulary = document.getElementById('stat-vocabulary');
                    const statAccuracy = document.getElementById('stat-accuracy');
                    
                    if (statTests) statTests.textContent = records.length;
                    
                    const maxVocabulary = records.reduce((max, r) => Math.max(max, r.vocabulary || 0), 0);
                    if (statVocabulary) statVocabulary.textContent = maxVocabulary;
                    
                    if (records.length > 0) {
                        const avgScore = records.reduce((sum, r) => sum + (r.score || 0), 0) / records.length;
                        if (statAccuracy) statAccuracy.textContent = Math.round(avgScore * 2) + '%';
                    } else {
                        if (statAccuracy) statAccuracy.textContent = '0%';
                    }
                    
                    const recordsDiv = document.getElementById('test-records');
                    if (!data.records || data.records.length === 0) {
                        recordsDiv.innerHTML = '<p>暂无测评记录，请先完成一次测评</p>';
                    } else {
                        let recordsHtml = '<table class="table table-striped table-sm">';
                        recordsHtml += '<thead><tr><th>测评时间</th><th>答对题目</th><th>词汇量</th><th>水平</th></tr></thead><tbody>';
                        
                        data.records.forEach(record => {
                            const date = new Date(record.createdAt).toLocaleString();
                            recordsHtml += `<tr>
                                <td>${date}</td>
                                <td>${record.score}</td>
                                <td>${record.vocabulary}</td>
                                <td>${record.level}</td>
                            </tr>`;
                        });
                        
                        recordsHtml += '</tbody></table>';
                        recordsDiv.innerHTML = recordsHtml;
                    }
                } else {
                    console.error('获取历史测评记录失败:', data.message);
                    document.getElementById('test-records').innerHTML = '<p class="text-danger">获取历史测评记录失败: ' + data.message + '</p>';
                    
                    // 如果token无效，清除本地存储并提示重新登录
                    if (data.message === '无效的token') {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        token = null;
                        currentUser = null;
                        alert('登录已过期，请重新登录');
                        showPage('login-page');
                    }
                }
            } catch (error) {
                console.error('加载用户个人信息失败:', error);
                const userInfoDiv = document.getElementById('user-info');
                if (userInfoDiv) {
                    userInfoDiv.innerHTML = '<p class="text-danger">获取用户信息失败，请检查网络连接</p>';
                }
                const testRecordsDiv = document.getElementById('test-records');
                if (testRecordsDiv) {
                    testRecordsDiv.innerHTML = '<p class="text-danger">获取历史测评记录失败，请检查网络连接</p>';
                }
            }
        }

        // 加载用户列表（管理员）
        async function loadUserList() {
            if (!token || currentUser.role !== 'admin') return;

            try {
                const response = await fetch('/api/admin/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();
                if (response.ok) {
                    const userListDiv = document.getElementById('user-list');
                    let userHtml = '<table class="table table-striped">';
                    userHtml += '<thead><tr><th>ID</th><th>用户名</th><th>角色</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody>';
                    
                    data.users.forEach(user => {
                        const date = new Date(user.createdAt).toLocaleString();
                        const statusText = user.status === 'active' ? '活跃' : '禁用';
                        const statusClass = user.status === 'active' ? 'btn-success' : 'btn-danger';
                        const statusAction = user.status === 'active' ? '禁用' : '启用';
                        
                        userHtml += `<tr>
                            <td>${user.id}</td>
                            <td>${user.username}</td>
                            <td>${user.role === 'admin' ? '管理员' : '普通用户'}</td>
                            <td>${statusText}</td>
                            <td>${date}</td>
                            <td><button class="btn ${statusClass} btn-sm" onclick="toggleUserStatus(${user.id}, '${user.status}')">${statusAction}</button></td>
                        </tr>`;
                    });
                    
                    userHtml += '</tbody></table>';
                    userListDiv.innerHTML = userHtml;
                } else {
                    console.error('获取用户列表失败:', data.message);
                    document.getElementById('user-list').innerHTML = '<p>获取用户列表失败</p>';
                }
            } catch (error) {
                console.error('加载用户列表失败:', error);
                document.getElementById('user-list').innerHTML = '<p>加载用户列表失败</p>';
            }
        }

        // 切换用户状态（管理员）
        async function toggleUserStatus(userId, currentStatus) {
            if (!token || currentUser.role !== 'admin') return;

            try {
                const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
                const response = await fetch(`/api/admin/users/${userId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: newStatus })
                });

                const data = await response.json();
                if (response.ok) {
                    alert('用户状态更新成功');
                    loadUserList();
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('更新用户状态失败:', error);
                alert('更新用户状态失败，请稍后重试');
            }
        }

        // 加载用户列表（管理员）
        async function loadUserList() {
            if (!token || currentUser.role !== 'admin') return;

            try {
                const response = await fetch('/api/admin/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();
                if (response.ok) {
                    const userListDiv = document.getElementById('user-list');
                    if (data.users.length === 0) {
                        userListDiv.innerHTML = '<p>暂无用户</p>';
                    } else {
                        let userHtml = '<table class="table table-striped">';
                        userHtml += '<thead><tr><th>ID</th><th>用户名</th><th>角色</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody>';
                        
                        data.users.forEach(user => {
                            const statusText = user.status === 'active' ? '活跃' : '禁用';
                            const statusClass = user.status === 'active' ? 'btn-warning' : 'btn-success';
                            const newStatus = user.status === 'active' ? 'inactive' : 'active';
                            const statusChangeText = user.status === 'active' ? '禁用' : '启用';
                            
                            userHtml += `<tr>
                                <td>${user.id}</td>
                                <td>${user.username}</td>
                                <td>${user.role === 'admin' ? '管理员' : '普通用户'}</td>
                                <td>${statusText}</td>
                                <td>${new Date(user.createdAt).toLocaleString()}</td>
                                <td><button class="btn ${statusClass} btn-sm" onclick="updateUserStatus(${user.id}, '${newStatus}')">${statusChangeText}</button></td>
                            </tr>`;
                        });
                        
                        userHtml += '</tbody></table>';
                        userListDiv.innerHTML = userHtml;
                    }
                } else {
                    console.error('获取用户列表失败:', data.message);
                    document.getElementById('user-list').innerHTML = '<p>获取用户列表失败</p>';
                }
            } catch (error) {
                console.error('加载用户列表失败:', error);
                document.getElementById('user-list').innerHTML = '<p>加载用户列表失败</p>';
            }
        }

        // 更新用户状态（管理员）
        async function updateUserStatus(userId, newStatus) {
            if (!token || currentUser.role !== 'admin') return;

            try {
                const response = await fetch(`/api/admin/users/${userId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: newStatus })
                });

                const data = await response.json();
                if (response.ok) {
                    alert('用户状态更新成功');
                    loadUserList();
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('更新用户状态失败:', error);
                alert('更新用户状态失败，请稍后重试');
            }
        }

        // 加载单词列表
        async function loadWordList(stage, level) {
            try {
                let url = '/api/words';
                const params = [];
                if (stage && stage !== 'all') params.push(`stage=${stage}`);
                if (level && level !== 'all') params.push(`level=${level}`);
                if (params.length > 0) url += '?' + params.join('&');
                
                const response = await fetch(url);
                const data = await response.json();
                if (response.ok) {
                    const wordListDiv = document.getElementById('word-list');
                    if (data.words.length === 0) {
                        wordListDiv.innerHTML = '<p>暂无单词</p>';
                    } else {
                        let wordHtml = '<table class="table table-striped table-sm" style="width: 100%;">';
                        wordHtml += '<thead><tr style="font-size: 12px;"><th style="width: 60px;">ID</th><th style="width: 120px;">单词</th><th style="width: 100px;">音标</th><th style="min-width: 200px;">释义</th><th style="width: 60px;">阶段</th><th style="width: 60px;">级别</th><th style="width: 100px;">操作</th></tr></thead><tbody>';
                        
                        data.words.forEach(word => {
                            const stageText = word.stage === 'primary' ? '小学' : word.stage === 'middle' ? '初中' : '高中';
                            const shortMeaning = word.meaning.length > 50 ? word.meaning.substring(0, 50) + '...' : word.meaning;
                            wordHtml += `<tr style="font-size: 12px;">
                                <td>${word.id}</td>
                                <td>${word.word}</td>
                                <td style="font-family: monospace;">${word.phonetic || '-'}</td>
                                <td title="${word.meaning}">${shortMeaning}</td>
                                <td>${stageText}</td>
                                <td>${word.level}级</td>
                                <td>
                                    <button class="btn btn-warning btn-xs me-1" style="padding: 2px 6px; font-size: 11px;" onclick="editWord(${word.id}, '${word.word}', '${word.phonetic || ''}', '${word.meaning}', '${word.stage}', ${word.level})">编辑</button>
                                    <button class="btn btn-danger btn-xs" style="padding: 2px 6px; font-size: 11px;" onclick="deleteWord(${word.id}, '${stage}', '${level}')">删除</button>
                                </td>
                            </tr>`;
                        });
                        
                        wordHtml += '</tbody></table>';
                        wordListDiv.innerHTML = wordHtml;
                    }
                } else {
                    console.error('获取单词列表失败:', data.message);
                    document.getElementById('word-list').innerHTML = '<p>获取单词列表失败</p>';
                }
            } catch (error) {
                console.error('加载单词列表失败:', error);
                document.getElementById('word-list').innerHTML = '<p>加载单词列表失败</p>';
            }
        }

        // 编辑单词（管理员）
        function editWord(id, word, phonetic, meaning, stage, level) {
            document.getElementById('edit-word-id').value = id;
            document.getElementById('edit-word').value = word;
            document.getElementById('edit-phonetic').value = phonetic;
            document.getElementById('edit-meaning').value = meaning;
            document.getElementById('edit-stage').value = stage;
            document.getElementById('edit-level').value = level;
            
            // 显示模态框
            const modal = new bootstrap.Modal(document.getElementById('edit-word-modal'));
            modal.show();
        }

        // 保存编辑（管理员）
        safeAddListener('save-edit-btn', 'click', async function() {
            const id = document.getElementById('edit-word-id').value;
            const word = document.getElementById('edit-word').value;
            const phonetic = document.getElementById('edit-phonetic').value;
            const meaning = document.getElementById('edit-meaning').value;
            const stage = document.getElementById('edit-stage').value;
            const level = document.getElementById('edit-level').value;

            if (!token || currentUser.role !== 'admin') return;

            try {
                const response = await fetch(`/api/words/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ word, meaning, phonetic, stage, level: parseInt(level) })
                });

                const data = await response.json();
                if (response.ok) {
                    alert('单词更新成功');
                    // 关闭模态框
                    const modal = bootstrap.Modal.getInstance(document.getElementById('edit-word-modal'));
                    modal.hide();
                    // 重新加载单词列表
                    const currentStage = document.getElementById('word-stage').value;
                    const currentLevel = document.getElementById('word-level').value;
                    loadWordList(currentStage, currentLevel);
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('更新单词失败:', error);
                alert('更新单词失败，请稍后重试');
            }
        });

        // 删除单词（管理员）
        async function deleteWord(wordId, stage, level) {
            if (!token || currentUser.role !== 'admin') return;

            if (!confirm('确定要删除这个单词吗？')) return;

            try {
                const response = await fetch(`/api/words/${wordId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();
                if (response.ok) {
                    alert('单词删除成功');
                    loadWordList(stage, level);
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('删除单词失败:', error);
                alert('删除单词失败，请稍后重试');
            }
        }

        // 加载所有测试记录（管理员）
        async function loadAllTestRecords() {
            if (!token || currentUser.role !== 'admin') return;

            try {
                const response = await fetch('/api/tests', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();
                if (response.ok) {
                    const recordsDiv = document.getElementById('test-records-list');
                    if (data.records.length === 0) {
                        recordsDiv.innerHTML = '<p>暂无测试记录</p>';
                    } else {
                        let recordsHtml = '<table class="table table-striped">';
                        recordsHtml += '<thead><tr><th>测试时间</th><th>用户ID</th><th>答对题目</th><th>词汇量</th><th>水平</th></tr></thead><tbody>';
                        
                        data.records.forEach(record => {
                            const date = new Date(record.createdAt).toLocaleString();
                            recordsHtml += `<tr>
                                <td>${date}</td>
                                <td>${record.userId}</td>
                                <td>${record.score}</td>
                                <td>${record.vocabulary}</td>
                                <td>${record.level}</td>
                            </tr>`;
                        });
                        
                        recordsHtml += '</tbody></table>';
                        recordsDiv.innerHTML = recordsHtml;
                    }
                } else {
                    console.error('获取所有测试记录失败:', data.message);
                    document.getElementById('test-records-list').innerHTML = '<p>获取测试记录失败</p>';
                }
            } catch (error) {
                console.error('加载测试记录失败:', error);
                document.getElementById('test-records-list').innerHTML = '<p>加载测试记录失败</p>';
            }
        }

        // 修改显示结果函数，添加保存测评记录的功能
        function showResult() {
            const vocabulary = calculateVocabulary();
            const level = evaluateLevel();
            
            // 显示结果页面
            document.getElementById('test-page').classList.add('d-none');
            document.getElementById('result-page').classList.remove('d-none');
            
            // 填充结果数据
            document.getElementById('level').textContent = level;
            document.getElementById('vocabulary-count').textContent = vocabulary.total;
            document.getElementById('correct-count').textContent = correctCount;
            document.getElementById('consecutive-incorrect').textContent = consecutiveIncorrect;
            document.getElementById('total-incorrect').textContent = totalIncorrect;
            
            // 更新进度条
            const primaryProgress = vocabulary.primary.rate * 100;
            const middleProgress = vocabulary.middle.rate * 100;
            const highProgress = vocabulary.high.rate * 100;
            
            const primaryBar = document.getElementById('primary-progress');
            primaryBar.style.width = `${primaryProgress}%`;
            primaryBar.textContent = `小学：${Math.round(primaryProgress)}%`;
            primaryBar.setAttribute('aria-valuenow', primaryProgress);
            
            const middleBar = document.getElementById('middle-progress');
            middleBar.style.width = `${middleProgress}%`;
            middleBar.textContent = `初中：${Math.round(middleProgress)}%`;
            middleBar.setAttribute('aria-valuenow', middleProgress);
            
            const highBar = document.getElementById('high-progress');
            highBar.style.width = `${highProgress}%`;
            highBar.textContent = `高中：${Math.round(highProgress)}%`;
            highBar.setAttribute('aria-valuenow', highProgress);

            // 保存测评记录
            saveTestRecord(correctCount, vocabulary.total, level);
        }

        // 更新底部导航栏状态
            function updateBottomNav(activeId) {
                document.querySelectorAll('.bottom-nav-item, .bottom-nav-center').forEach(item => {
                    item.classList.remove('active');
                });
                const activeEl = document.getElementById(activeId);
                if (activeEl) {
                    activeEl.classList.add('active');
                }
            }
            
            // 显示个人中心标签页
            function showProfileTab(tabId) {
                document.querySelectorAll('#profile-content > div').forEach(el => {
                    el.classList.add('d-none');
                });
                document.getElementById('profile-' + tabId).classList.remove('d-none');
                
                if (tabId === 'records') {
                    loadUserProfile();
                } else if (tabId === 'wrong') {
                    loadWrongWords();
                } else if (tabId === 'chart') {
                    drawVocabularyChart();
                }
            }
            
            // 暴露到全局作用域
            window.showProfileTab = showProfileTab;

            // 启动应用
            window.onload = init;
        