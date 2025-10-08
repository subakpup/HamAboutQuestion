const modeToggle = document.getElementById('mode-toggle');
function setMode(mode) {
    if (mode === 'dark') {
        document.body.classList.add('dark-mode');
        modeToggle.textContent = '☀️ 라이트모드';
    } else {
        document.body.classList.remove('dark-mode');
        modeToggle.textContent = '🌙 다크모드';
    }
    localStorage.setItem('quiz-mode', mode);
}
modeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-mode');
    setMode(isDark ? 'light' : 'dark');
});
setMode(localStorage.getItem('quiz-mode') || 'light');

document.addEventListener('DOMContentLoaded', () => {
    fetch('./assets/data/questions.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error('questions.csv 파일을 찾을 수 없습니다.');
            }
            return response.text();
        })
        .then(data => {
            const questions = parseCSV(data);

            if (questions.length === 0) {
                document.getElementById('question-area').innerHTML =
                    '<p style="text-align:center; color:red;">파일에 유효한 문제가 없거나, 형식이 올바르지 않습니다.</p>';
                return;
            }

            function shuffleArray(array) {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
            }

            let correctAnswers = 0;
            const totalQuestions = questions.length;
            let currentQuestionIndex = 0;

            function startQuiz() {
                shuffleArray(questions);
                correctAnswers = 0;
                currentQuestionIndex = 0;
                document.getElementById('result').style.display = 'block';
                document.getElementById('question-area').style.display = 'block';
                document.getElementById('completion-message').style.display = 'none';
                displayQuestion(questions[currentQuestionIndex]);
            }

            startQuiz();

            function escapeHTML(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            function displayQuestion(question) {
                const qArea = document.getElementById('question-area');
                qArea.innerHTML = '';
                document.getElementById('result').innerHTML = '';

                const progressDiv = document.createElement('div');
                progressDiv.id = 'quiz-progress';
                progressDiv.textContent = `문제 ${currentQuestionIndex + 1} / ${totalQuestions}`;
                qArea.appendChild(progressDiv);

                const title = document.createElement('h2');
                title.className = 'question-title';
                title.innerHTML = escapeHTML(question.title);
                qArea.appendChild(title);

                if (question.img && question.img.trim() !== '본인이 직접 정리해보세요!!!') {
                    const rawPath = question.img.trim().replace(/^\/+/, ''); 
                    const imgPath = './assets/' + rawPath;
                    const img = document.createElement('img');
                    img.className = 'question-img';
                    img.src = imgPath;
                    img.alt = '문제 이미지';
                    qArea.appendChild(img);
                }

                if (question.type === '객관식') {
                    const optionsDiv = document.createElement('div');
                    optionsDiv.className = 'answer-options';
                    ['select1', 'select2', 'select3', 'select4'].forEach(key => {
                        if (question[key]) {
                            const optionLabel = document.createElement('label');
                            optionLabel.innerHTML =
                                `<input type="radio" name="answer" value="${escapeHTML(question[key].trim())}"> ${escapeHTML(question[key].trim())}`;
                            optionsDiv.appendChild(optionLabel);
                        }
                    });
                    qArea.appendChild(optionsDiv);
                } else if (question.type === '주관식') {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.id = 'user-answer';
                    input.className = 'answer-input';
                    input.placeholder = '답변을 입력하세요';
                    qArea.appendChild(input);
                }

                if (question.tag) {
                    const tagDiv = document.createElement('div');
                    tagDiv.id = 'quiz-tag';
                    tagDiv.textContent = `태그: ${question.tag.split(',').map(tag => tag.trim()).join(', ')}`;
                    qArea.appendChild(tagDiv);
                }

                const buttonGroup = document.createElement('div');
                buttonGroup.className = 'button-group';

                const leftButtons = document.createElement('div');
                leftButtons.className = 'left-buttons button-row';

                const rightButtons = document.createElement('div');
                rightButtons.className = 'right-buttons button-row';

                const submitBtn = document.createElement('button');
                submitBtn.id = 'submit-btn';
                submitBtn.textContent = '정답 확인';
                submitBtn.onclick = () => checkAnswer(question);
                leftButtons.appendChild(submitBtn);

                const nextBtn = document.createElement('button');
                nextBtn.id = 'next-btn';
                nextBtn.textContent = '다음 문제';
                nextBtn.style.display = 'none';
                nextBtn.onclick = () => {
                    if (currentQuestionIndex < questions.length - 1) {
                        currentQuestionIndex++;
                        displayQuestion(questions[currentQuestionIndex]);
                    } else {
                        const quizSummary = document.getElementById('quiz-summary');
                        quizSummary.innerHTML = `
                            <p>정답: ${correctAnswers}개</p>
                            <p>총 문제: ${totalQuestions}개</p>
                        `;
                        document.getElementById('question-area').style.display = 'none';
                        document.getElementById('result').style.display = 'none';
                        document.getElementById('completion-message').style.display = 'block';
                    }
                };
                leftButtons.appendChild(nextBtn);

                const correctBtn = document.createElement('button');
                correctBtn.id = 'correct-btn';
                correctBtn.textContent = '정답 처리';
                correctBtn.style.display = 'none';
                correctBtn.onclick = () => {
                    correctAnswers++;
                    document.getElementById('result').className = 'correct';
                    document.getElementById('result').innerHTML = '✅ 정답으로 처리되었습니다!';
                    document.getElementById('correct-btn').style.display = 'none';
                    document.getElementById('next-btn').style.display = 'inline-block';
                };
                rightButtons.appendChild(correctBtn);

                buttonGroup.appendChild(leftButtons);
                buttonGroup.appendChild(rightButtons);
                qArea.appendChild(buttonGroup);
            }

            function checkAnswer(question) {
                const resultDiv = document.getElementById('result');
                resultDiv.innerHTML = '';
                resultDiv.className = '';

                let userAnswer = '';
                if (question.type === '객관식') {
                    const selectedOption = document.querySelector('input[name="answer"]:checked');
                    if (selectedOption) {
                        userAnswer = selectedOption.value.trim();
                        document.querySelectorAll('input[name="answer"]').forEach(input => { input.disabled = true; });
                    }
                } else if (question.type === '주관식') {
                    const input = document.getElementById('user-answer');
                    userAnswer = input.value.trim();
                    input.disabled = true;
                }
                document.getElementById('submit-btn').style.display = 'none';

                let correctAnswer = question.answer.trim();
                if (correctAnswer.startsWith('"') && correctAnswer.endsWith('"')) {
                    correctAnswer = correctAnswer.slice(1, -1);
                }

                const possibleAnswers = correctAnswer.split(',').map(ans => ans.trim().toLowerCase());

                if (possibleAnswers.includes(userAnswer.toLowerCase())) {
                    resultDiv.className = 'correct';
                    resultDiv.innerHTML = '✅ 정답입니다!';
                    correctAnswers++;
                    document.getElementById('next-btn').style.display = 'inline-block';
                    document.getElementById('correct-btn').style.display = 'none';
                } else {
                    resultDiv.className = 'incorrect';
                    resultDiv.innerHTML = `❌ 오답입니다!<br>정답: ${escapeHTML(correctAnswer)}`;
                    document.getElementById('next-btn').style.display = 'inline-block';
                    document.getElementById('correct-btn').style.display = 'inline-block';
                }

                if (question.description) {
                    const descriptionDiv = document.createElement('div');
                    descriptionDiv.id = 'description';
                    descriptionDiv.innerHTML = `<span id="description-header">설명</span><br>${escapeHTML(question.description).replace(/\\n/g, '<br>')}`;
                    resultDiv.appendChild(descriptionDiv);
                }
            }

            function parseCSV(csvText) {
                const lines = csvText.split('\r\n');
                const headers = lines[0].split(',');
                const data = [];
                for (let i = 1; i < lines.length; i++) {
                    const currentLine = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                    if (currentLine.length === headers.length) {
                        const row = {};
                        for (let j = 0; j < headers.length; j++) {
                            row[headers[j].trim()] = currentLine[j].trim().replace(/^"|"$/g, '');
                        }
                        data.push(row);
                    }
                }
                return data;
            }

            document.getElementById('restart-btn').addEventListener('click', () => {
                startQuiz();
            });
        })
        .catch(error => {
            console.error('퀴즈 데이터를 불러오는 중 오류가 발생했습니다:', error);
            document.getElementById('question-area').innerHTML =
                `<p style="text-align:center; color:red;">퀴즈 데이터를 불러올 수 없습니다. 파일(assets/data/questions.csv)이 올바른 위치에 있는지 확인해주세요.</p>`;
        });
});
