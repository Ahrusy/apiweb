document.addEventListener('DOMContentLoaded', function() {
    const quoteText = document.getElementById('quote-text');
    const quoteAuthor = document.getElementById('quote-author');
    const quoteCategory = document.getElementById('quote-category');
    const newQuoteBtn = document.getElementById('new-quote-btn');
    const copyQuoteBtn = document.getElementById('copy-quote-btn');
    const categorySelect = document.getElementById('category-select');
    const quotesHistory = document.getElementById('quotes-history');
    const notification = document.getElementById('notification');

    let currentCategory = '';

    // Загрузить первую цитату при загрузке страницы
    fetchQuote();
    fetchHistory();

    // Обработчик для кнопки новой цитаты
    newQuoteBtn.addEventListener('click', fetchQuote);

    // Обработчик для кнопки копирования
    copyQuoteBtn.addEventListener('click', copyQuoteToClipboard);

    // Обработчик для выбора категории
    categorySelect.addEventListener('change', function() {
        currentCategory = this.value;
        fetchQuote();
    });

    // Функция для загрузки цитаты
    function fetchQuote() {
        // Показываем индикатор загрузки
        quoteText.textContent = 'Загрузка...';
        quoteAuthor.textContent = '';
        quoteCategory.textContent = '';

        // Создаем URL с учетом выбранной категории
        let url = '/get-quote';
        if (currentCategory) {
            url += `?category=${currentCategory}`;
        }

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка сети');
                }
                return response.json();
            })
            .then(data => {
                // Обновляем DOM с новой цитатой
                quoteText.textContent = `"${data.quote}"`;
                quoteAuthor.textContent = `— ${data.author}`;

                // Добавляем информацию об источнике и категории
                let categoryText = data.category && data.category !== 'random'
                    ? `Категория: ${data.category}`
                    : '';

                if (data.error) {
                    categoryText = categoryText
                        ? `${categoryText} | ${data.error}`
                        : data.error;
                }

                quoteCategory.textContent = categoryText;

                // Добавляем скрытый элемент с информацией об источнике
                const existingSourceInfo = document.querySelector('.source-info');
                if (existingSourceInfo) {
                    existingSourceInfo.remove();
                }

                const sourceInfo = document.createElement('div');
                sourceInfo.className = 'source-info';
                sourceInfo.textContent = `Источник: ${data.source}`;
                quoteCategory.after(sourceInfo);

                // Добавляем анимацию
                animateQuoteChange();

                // Обновляем историю
                fetchHistory();

                // Показываем уведомление, если используется резервный источник
                if (data.source !== 'quoteslate') {
                    showNotification(`Используется источник: ${data.source}`, 'info');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                quoteText.textContent = 'Не удалось загрузить цитату. Пожалуйста, попробуйте позже.';
                quoteAuthor.textContent = '— Ошибка';
                quoteCategory.textContent = 'Попробуйте обновить страницу или выбрать другую категорию';

                // Показываем уведомление об ошибке
                showNotification('Ошибка при загрузке цитаты', 'error');
            });
    }

    // Функция для анимации смены цитаты
    function animateQuoteChange() {
        const quoteBox = document.querySelector('.quote-box');
        quoteBox.classList.remove('fade-in');
        void quoteBox.offsetWidth; // Trigger reflow
        quoteBox.classList.add('fade-in');
    }

    // Функция для копирования цитаты
    function copyQuoteToClipboard() {
        const textToCopy = `${quoteText.textContent}\n${quoteAuthor.textContent}`;

        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                showNotification('Цитата скопирована в буфер обмена!');
            })
            .catch(err => {
                showNotification('Не удалось скопировать цитату', 'error');
                console.error('Ошибка копирования:', err);
            });
    }

    // Функция для отображения уведомления
    function showNotification(message, type = 'success') {
        notification.textContent = message;
        notification.className = 'notification';

        // Устанавливаем цвет в зависимости от типа
        switch(type) {
            case 'error':
                notification.style.backgroundColor = 'var(--error-color)';
                break;
            case 'info':
                notification.style.backgroundColor = 'var(--primary-color)';
                break;
            default:
                notification.style.backgroundColor = 'var(--success-color)';
        }

        notification.classList.add('show');

        // Скрываем уведомление через 3 секунды
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Функция для загрузки истории цитат
    function fetchHistory() {
        fetch('/get-history')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка загрузки истории');
                }
                return response.json();
            })
            .then(data => {
                // Очищаем историю
                quotesHistory.innerHTML = '';

                // Добавляем цитаты в историю (в обратном порядке)
                data.reverse().forEach((quote, index) => {
                    const historyItem = document.createElement('div');
                    historyItem.className = 'history-item';

                    // Создаем содержимое элемента истории
                    historyItem.innerHTML = `
                        <div class="history-quote">"${quote.quote}"</div>
                        <div class="history-meta">
                            <span>— ${quote.author}</span>
                            <span>${formatTime(quote.timestamp)}</span>
                        </div>
                        <div class="history-source">Источник: ${quote.source}</div>
                    `;

                    // Добавляем обработчик клика для загрузки цитаты из истории
                    historyItem.addEventListener('click', () => {
                        quoteText.textContent = `"${quote.quote}"`;
                        quoteAuthor.textContent = `— ${quote.author}`;

                        let categoryText = quote.category && quote.category !== 'random'
                            ? `Категория: ${quote.category}`
                            : '';

                        quoteCategory.textContent = categoryText;

                        // Обновляем информацию об источнике
                        const existingSourceInfo = document.querySelector('.source-info');
                        if (existingSourceInfo) {
                            existingSourceInfo.textContent = `Источник: ${quote.source}`;
                        } else {
                            const sourceInfo = document.createElement('div');
                            sourceInfo.className = 'source-info';
                            sourceInfo.textContent = `Источник: ${quote.source}`;
                            quoteCategory.after(sourceInfo);
                        }

                        // Анимируем изменение
                        animateQuoteChange();

                        showNotification('Цитата из истории загружена', 'info');
                    });

                    quotesHistory.appendChild(historyItem);
                });
            })
            .catch(error => {
                console.error('Ошибка загрузки истории:', error);
                quotesHistory.innerHTML = '<div class="history-error">Не удалось загрузить историю цитат</div>';
            });
    }

    // Функция для форматирования времени
    function formatTime(timestamp) {
        if (!timestamp) return '';

        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            console.error('Ошибка форматирования времени:', e);
            return timestamp;
        }
    }
});