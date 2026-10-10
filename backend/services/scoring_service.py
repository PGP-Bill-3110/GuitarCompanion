from typing import Any


def align_note_sequences(
    expected: list[int],
    detected: list[int],
) -> dict[str, Any]:

    n = len(expected)
    m = len(detected)

    # =========================================
    # LEVENSHTEIN DP TABLE
    # =========================================

    dp = [
        [0] * (m + 1)
        for _ in range(n + 1)
    ]

    for i in range(n + 1):
        dp[i][0] = i

    for j in range(m + 1):
        dp[0][j] = j

    for i in range(
        1,
        n + 1
    ):
        for j in range(
            1,
            m + 1
        ):

            if (
                expected[i - 1]
                ==
                detected[j - 1]
            ):
                substitution_cost = 0

            else:
                substitution_cost = 1

            dp[i][j] = min(
                # missed expected note
                dp[i - 1][j] + 1,

                # extra detected note
                dp[i][j - 1] + 1,

                # correct / wrong note
                dp[i - 1][j - 1]
                + substitution_cost,
            )

    # =========================================
    # BACKTRACK
    # =========================================

    i = n
    j = m

    alignment = []

    correct = 0
    wrong = 0
    missed = 0
    extra = 0

    while (
        i > 0
        or
        j > 0
    ):

        # -------------------------------------
        # EXACT MATCH
        # -------------------------------------

        if (
            i > 0
            and
            j > 0
            and
            expected[i - 1]
            ==
            detected[j - 1]
            and
            dp[i][j]
            ==
            dp[i - 1][j - 1]
        ):

            alignment.append({
                "type":
                    "correct",

                "expected":
                    expected[i - 1],

                "detected":
                    detected[j - 1],

                "expectedIndex":
                    i - 1,

                "detectedIndex":
                    j - 1,
            })

            correct += 1

            i -= 1
            j -= 1

            continue

        # -------------------------------------
        # WRONG NOTE / SUBSTITUTION
        # -------------------------------------

        if (
            i > 0
            and
            j > 0
            and
            dp[i][j]
            ==
            dp[i - 1][j - 1]
            + 1
        ):

            alignment.append({
                "type":
                    "wrong",

                "expected":
                    expected[i - 1],

                "detected":
                    detected[j - 1],

                "expectedIndex":
                    i - 1,

                "detectedIndex":
                    j - 1,
            })

            wrong += 1

            i -= 1
            j -= 1

            continue

        # -------------------------------------
        # MISSED NOTE
        # -------------------------------------

        if (
            i > 0
            and
            dp[i][j]
            ==
            dp[i - 1][j]
            + 1
        ):

            alignment.append({
                "type":
                    "missed",

                "expected":
                    expected[i - 1],

                "detected":
                    None,

                "expectedIndex":
                    i - 1,

                "detectedIndex":
                    None,
            })

            missed += 1

            i -= 1

            continue

        # -------------------------------------
        # EXTRA NOTE
        # -------------------------------------

        alignment.append({
            "type":
                "extra",

            "expected":
                None,

            "detected":
                detected[j - 1],

            "expectedIndex":
                None,

            "detectedIndex":
                j - 1,
        })

        extra += 1

        j -= 1


    alignment.reverse()


    # =========================================
    # SCORE
    # =========================================

    edit_distance = (
        dp[n][m]
    )

    denominator = max(
        n,
        m,
        1,
    )

    note_accuracy = (
        1.0
        -
        (
            edit_distance
            /
            denominator
        )
    )

    note_accuracy = max(
        0.0,
        note_accuracy,
    )

    return {
        "expectedCount":
            n,

        "detectedCount":
            m,

        "correct":
            correct,

        "wrong":
            wrong,

        "missed":
            missed,

        "extra":
            extra,

        "editDistance":
            edit_distance,

        "noteAccuracy":
            round(
                note_accuracy
                * 100,
                1,
            ),

        "alignment":
            alignment,
    }