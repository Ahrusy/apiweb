from flask import Flask, render_template, jsonify, request
import requests
from datetime import datetime

app = Flask(__name__)

# Ключ API (можно получить бесплатно на https://favqs.com/)
API_KEY = "230ebcf03c9d7bc8622d292c4aceef60"  # Замените на реальный ключ


def get_russian_quote():
    """Получаем русскую цитату через API"""
    try:
        headers = {
            "Authorization": f"Token token={API_KEY}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

        # Параметры для русских цитат
        params = {
            "language": "ru",
            "filter": "language:russian"
        }

        response = requests.get(
            "https://favqs.com/api/quotes",
            headers=headers,
            params=params,
            timeout=5
        )

        response.raise_for_status()
        data = response.json()

        if data['quotes']:
            quote = random.choice(data['quotes'])
            return {
                "quote": quote['body'],
                "author": quote['author'],
                "source": "favqs",
                "language": "ru",
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }

    except Exception as e:
        print(f"Ошибка API: {str(e)}")

    # Возвращаем локальную цитату при ошибке
    return {
        "quote": "Мы сами должны стать теми переменами, которые хотим увидеть в мире.",
        "author": "Махатма Ганди",
        "source": "local",
        "language": "ru",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get-quote')
def get_quote():
    quote = get_russian_quote()
    return jsonify(quote)


if __name__ == '__main__':
    app.run(debug=True)