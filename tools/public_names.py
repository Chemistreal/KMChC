#!/usr/bin/env python3
"""**공개 저장소에 남의 실명이 실려 있나**를 잰다.

왜 이 자가 있나
---------------
2026-08-11 에 네 저장소를 한꺼번에 재어 보니, 실명이 나온 곳은 여기 하나였다.

    exam            0곳 (나온 것은 '홍길동' 뿐이었다)
    DT              0곳 (109개가 걸렸지만 '옥텟규칙 · 몰질량' 같은 말이었다)
    study64-report  0곳
    KMChC           두 곳 — 아래

  ① 리포트링크생성기.html  열아홉 명. 이름·학년·유형에 **응답 원본까지.**
     한 파일에 33,462자, 그 화면 전체의 79%였다. 링크를 만들려고 시트에서
     한 번 붙여넣은 것이 그대로 굳었다. 지웠다 — **지워도 아무것도 안 깨진다.**
     이미 보낸 링크는 문자열이고, 이 화면이 스스로 안내하는 길은 붙여넣기다.

  ② report-data/*.json  쉰여덟 장 가운데 이름이 실린 것 쉰여섯, 사람 쉰셋.
     (나머지 둘은 이름 칸이 비었거나 `test` 다. 쉰셋은 이름 하나와
      그 뒤에 괄호를 단 것을 한 사람으로 센 값이다 — 같은 반 동명이인이라
      선생님이 손으로 갈라 적어 두셨다.)
     `{id, name, grade, answers, savedAt}` — 이건 **지우면 안 된다.**
     Apps Script 가 저장할 때마다 여기에 한 장씩 넣고, 학부모에게 간 링크
     (`report.html?id=…`)가 바로 이 파일을 읽는다. 지우면 이미 보낸 리포트가
     그 자리에서 깨진다. 그래서 이 자는 **여기는 안 막는다.**

     ⚠ 다만 이건 **막을 자리가 아니라 고칠 자리다.** 재어 보니 report.html 은
       이미 `?n=` 을 받게 되어 있고(1252줄), 파일에 이름이 없으면 주소의
       이름으로 넘어간다. 즉 **이름을 파일에서 빼고 링크에 실으면**, 공개 파일
       에는 익명 응답만 남고 이름은 링크를 쥔 사람만 본다. 화면은 안 고쳐도
       된다 — Apps Script 와 링크 만드는 곳만 고치면 된다.
       옛 쉰여덟 장은 이미 `&n=` 없이 나갔으니, 거기서 이름을 빼면 그 리포트만
       이름을 잃는다. 그 맞바꿈은 **사람이 정한다** → docs/공개된-이름.md.

이 자가 막는 것
---------------
`report-data/` **말고 다른 곳**에 실명이 나오면 빨간불. ①이 굳었을 때 이 자가
있었으면 그날 걸렸다. 없으면 여섯 달 뒤에 스무 번째가 조용히 붙는다.

한계 — **자는 자다.** 한글 두세 자를 다 사람 이름으로 볼 수는 없어서, 자료 칸
이름(`"name"` · `"n"` · `"이름"`)에 든 것만 본다. 그 칸 밖에 적힌 이름은 이
자가 못 본다. 재는 것과 막는 것은 다르다.

    python3 tools/public_names.py           # 어디에 몇 명이 실려 있나
    python3 tools/public_names.py --check   # 적어 둔 자리 밖에 실명이 나오면 빨간불
"""
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 자료 칸에 든 값만 본다. 문장 속 이름은 이 자가 못 본다(위 한계).
#
# ⚠ 값 **전체**가 이름일 때만 세면 안 된다. 처음에 `"…"` 로 닫아 두었더니
#   이름 뒤에 괄호를 단 한 장이 통째로 안 보였다. 같은 반에 같은 이름이
#   둘이라 손으로 갈라 적어 두신 것인데, 갈라 적을 만큼 신경 쓴 이름일수록
#   이 자한테서 숨는 꼴이었다. 그래서 **값 앞머리의 한글만** 본다.
NAME = re.compile(r'"(?:n|name|이름)"\s*:\s*"\s*([가-힣]{2,4})(?![가-힣])')

# 실명이 있어도 되는 자리와 **까닭.** 비워 두면 이 자는 늘 빨간불이고,
# 늘 빨간불이면 아무도 안 본다.
ALLOWED = {
    'report-data/': '학부모에게 간 report.html?id= 링크가 이 파일을 읽는다. '
                    '지우면 이미 보낸 리포트가 깨진다 — 고칠 자리이지 막을 자리가 아니다',
}

# 사람이 아닌데 걸리는 말. 걸린 것을 **눈으로 보고 하나씩** 적는다.
#
# ⚠ 처음에는 '…성 · …율 · …수 · …점 으로 끝나면 화학 용어' 같은 규칙으로
#   걸렀다. 그랬더니 그렇게 끝나는 **학생 넷**이 용어로 걸러져
#   쉰셋이 마흔아홉으로 줄었다. 실명을 세는 자가 실명을 못 보면 그 자는
#   없는 것보다 나쁘다 — 세었다는 안심만 준다. 그래서 짐작으로 거르지 않는다.
#   여기 적힌 것만 뺀다. 늘어나면 사람이 한 번 더 보게 된다.
NOT_A_PERSON = {
    '홍길동', '김철수', '이영희',            # 예시로 쓰는 이름
    '문제지', '안내문', '오답노트', '해설', '챌린지', '일반화학',
}


def tracked():
    """git 이 아는 파일. **-z 로 받는다.**

    [한 번 틀렸던 곳] 처음에는 `git ls-files` 를 그냥 읽었다. git 은 한글 이름을
    따옴표에 넣어 `"\\352\\264\\200…"` 로 내주기 때문에, 그 이름의 파일이 통째로
    검사에서 빠졌다. 그래서 이 저장소에서 **가장 많이 실려 있던 화면**
    (리포트링크생성기.html, 열아홉 명)이 '0곳' 으로 나왔다.
    자가 못 본 것과 거기 없는 것은 다르다.

    [또 한 번] 그다음엔 `--cached` 만 보았다. 그래서 **아직 담지 않은 새 파일**
    은 안 보였고, 손에서는 초록인데 커밋하자마자 판이 빨간불이 났다 — 이 자를
    만들며 쓴 문서와 주석이 딱 그렇게 걸렸다. 담긴 것과 담을 것을 같이 본다."""
    out = subprocess.run(['git', 'ls-files', '-z',
                          '--cached', '--others', '--exclude-standard'],
                         cwd=ROOT, capture_output=True, text=True).stdout
    return sorted(set(f for f in out.split('\0') if f))


SKIP_EXT = ('.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf', '.woff', '.woff2',
            '.zip', '.ico')


def names_in(src):
    """이 글의 자료 칸에 실려 있다고 자가 보는 사람 이름들.

    tools/lie_check.py 가 이 함수에 참·거짓 예시를 먹인다. 위에 적어 둔 두 번의
    실수(사람을 용어로 삼킨 것 · 괄호 붙은 이름을 못 본 것)가 거기 박혀 있다."""
    return {n for n in NAME.findall(src) if n not in NOT_A_PERSON}


def scan():
    """파일 → 그 안에서 자료 칸에 실린 사람 이름들."""
    hits = {}
    for f in tracked():
        if f.endswith(SKIP_EXT) or f.startswith('node_modules/'):
            continue
        try:
            s = open(os.path.join(ROOT, f), encoding='utf-8', errors='ignore').read()
        except OSError:
            continue
        ns = names_in(s)
        if ns:
            hits[f] = ns
    return hits


def allowed_for(path):
    for pre, why in ALLOWED.items():
        if path.startswith(pre):
            return why
    return None


def main():
    check = '--check' in sys.argv
    hits = scan()
    ok, bad = {}, {}
    for f, ns in hits.items():
        (ok if allowed_for(f) else bad)[f] = ns

    for pre, why in ALLOWED.items():
        fs = [f for f in ok if f.startswith(pre)]
        names = set().union(*[ok[f] for f in fs]) if fs else set()
        print('  적어 둔 자리  %-16s %3d장 · 이름 %3d개' % (pre, len(fs), len(names)))
        print('                %s' % why)

    if not bad:
        print('\n적어 둔 자리 밖에는 실명이 없다.')
        return 0

    total = set().union(*bad.values())
    print('\n적어 두지 않은 자리에 실명이 실려 있다 — %d장 · 이름 %d개'
          % (len(bad), len(total)))
    for f, ns in sorted(bad.items(), key=lambda x: -len(x[1])):
        kb = os.path.getsize(os.path.join(ROOT, f)) / 1024
        print('  %3d명  %-42s %7.0fKB  %s'
              % (len(ns), f, kb, ' · '.join(sorted(ns)[:4])))
    print('\n이 저장소는 공개다 — 주소를 몰라도 GitHub 에서 그냥 읽힌다.')
    print('걷어내든지, 남겨야 할 까닭이 있으면 tools/public_names.py 의')
    print('ALLOWED 에 **까닭과 함께** 적는다. 사람이 아닌 말이 걸렸으면')
    print('NOT_A_PERSON 에 적는다.')
    return 1 if check else 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except BrokenPipeError:
        os._exit(0)
