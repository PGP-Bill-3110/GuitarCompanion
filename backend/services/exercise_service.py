import json
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent

EXERCISES_FILE = (
    BASE_DIR
    / "data"
    / "exercises.json"
)


def load_exercises():
    with open(
        EXERCISES_FILE,
        "r",
        encoding="utf-8",
    ) as file:
        return json.load(file)


def get_all_exercises():
    return load_exercises()


def get_exercise_by_id(
    exercise_id: str
):
    exercises = load_exercises()

    for exercise in exercises:
        if exercise["id"] == exercise_id:
            return exercise

    return None