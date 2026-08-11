#!/usr/bin/env python3
"""**자가 거짓말을 하는지** 잰다 — 참·거짓 예시를 주고 맞히는지 본다.

이 자가 생긴 사연은 DT 저장소에 있다. `tools/audit_pages.py` 가 **화면 152장
가운데 152장**이 대비 미달이라고 말하고 있었다. 열어 보니 전부 거짓이었다.

    --o-bg(맞은 문항의 연둣빛 띠) 같은 **상태 색**을 종이로 쳤다
    어두운 화면의 밝은 글씨를 흰 종이에 얹어 쟀다
      → --ink 1.07:1 이라고 했다. 실제로는 15.17:1 로 가장 잘 읽히는 자리다

`--check` 는 0 을 내고 있었으므로 CI 는 초록불이었고, 그래서 **아무도 이
경고를 안 봤다.** 잘못 재는 자는 안 재느니만 못하다 — 사람이 경고를 무시하게
되고, 그러면 진짜가 와도 안 본다.

그리고 이 저장소의 `audit_pages.py` 는 **아무것도 막지 않고 있었다** —
200줄짜리 옛 판이라 `--check` 를 읽는 자리도 종료 코드도 없었다. 같은 자가
저장소마다 갈라져 한쪽만 고쳐져 있었다. 자를 고칠 때는 네 쪽을 같이 본다.

여기서는 자마다 맞혀야 할 문제를 붙여 둔다. 자를 고치다가 넓히거나 좁히면
여기서 걸린다.

    python3 tools/lie_check.py           # 자마다 맞혔는지
    python3 tools/lie_check.py --check   # 하나라도 틀리면 빨간불 (CI용)
"""
import importlib.util
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _load(rel):
    spec = importlib.util.spec_from_file_location('t', os.path.join(ROOT, rel))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# ⚠ 규칙을 **베끼지 않는다.** 베껴 두면 자를 고쳤을 때 여기가 옛 규칙을
#   맞히고 앉아, 자가 틀려도 초록불이 된다. 진짜 자를 그대로 부른다.
audit_pages = _load('tools/audit_pages.py')
store_ledger = _load('tools/store_ledger.py')
public_names = _load('tools/public_names.py')

PAGE = ('<!doctype html><html lang="ko"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>ㄱ</title><style>%s</style></head>'
        '<body><h1>ㄱ</h1><p>가나다라</p></body></html>')


def contrast_hits(css):
    """팔레트만 바꾼 한 장을 만들어, 대비 경고가 나오는지만 본다."""
    d = tempfile.mkdtemp()
    p = os.path.join(d, 't.html')
    open(p, 'w', encoding='utf-8').write(PAGE % css)
    return bool([h for h in audit_pages.audit(p) if '대비' in h[0]])


def store_keys(src):
    """이 글이 브라우저에 남긴다고 자가 세는 칸 이름들."""
    return sorted(store_ledger.keys_in(src))


def J(name):
    """이름을 자료 칸에 넣어 예시를 만든다. **여기서 조립하는 까닭**은
    아래 public_names 예시 앞 주석에."""
    return '{"' + 'name' + '":"' + name + '"}'


CASES = [
    ('audit_pages 대비', contrast_hits, [
        ('어느 바탕에서도 안 읽히는 색은 잡는다',
         ':root{--paper:#ffffff;--card:#f7f7f7;--muted:#eeeeee}', True),
        ('어두운 화면의 밝은 글씨는 안 잡는다',
         ':root{--bg:#0f1216;--card:#171b21;--ink:#e9e7e0}', False),
        ('밝은 팔레트와 어두운 팔레트가 한 파일에 섞여도 안 잡는다',
         ':root{--bg:#0f1216;--panel:#fff;--muted:#9aa0a8}', False),
        ('상태 띠(--o-bg)는 종이가 아니다',
         ':root{--paper:#FAFAF7;--o-bg:#E7F5EC;--brass-ink:#866A20}', False),
        ('짝이 있는 글자색은 그 짝 위에서 잰다',
         ':root{--paper:#FAFAF7;--warn-bg:#3A2A10;--warn-ink:#F3E6C8}', False),
    ]),
    ('store_ledger 저장 칸', store_keys, [
        ('따옴표로 바로 적은 칸은 잡는다',
         "localStorage.setItem('kmchc_session_v1', v)", ['kmchc_session_v1']),
        ('상수에 담아 둔 칸도 값을 찾아 푼다',
         "const KEY='kmchc_last_round';localStorage.setItem(KEY,v)", ['kmchc_last_round']),
        ('래퍼를 거쳐도 대문자 상수면 잡는다',
         "const PAL_KEY='kmchc_pal_v1';function set(k,v){localStorage.setItem(k,v)}"
         "S.set(PAL_KEY,1)", ['kmchc_pal_v1']),
        # 자가 여기서 거짓말을 했다. 배지 이름을 담은 **소문자 지역 변수**를
        # 저장 칸으로 세어 'starb' 라는 칸이 있다고 말했다(exam/index.html).
        ('배지 이름을 담은 소문자 지역 변수는 저장 칸이 아니다',
         "const map=[['전 문항','check'],['상위','starb']];const key='starb';"
         "function set(k,v){localStorage.setItem(k,v)}x.set(key)", []),
    ]),
    # 실명을 세는 자가 실명을 못 보면, 그 자는 없는 것보다 나쁘다 — 세었다는
    # 안심만 준다. 그래서 **자가 실제로 놓쳤던 두 가지**를 여기 박아 둔다.
    # ⚠ 여기 예시에는 **지어낸 이름만** 쓴다. 처음에는 자가 실제로 놓쳤던
    #   학생들의 이름을 그대로 적었는데, 그러자 public_names 가 이 파일을
    #   잡아냈다 — 맞게 잡았다. 실명이 새는 것을 막는 자의 예시가 실명이면
    #   그 자가 새는 자리가 된다. 지어낸 이름으로도 규칙은 똑같이 재어진다.
    #
    #   그리고 예시를 **조립해서** 먹인다(J). 이름 칸과 이름을 한 줄에 붙여
    #   적어 두면 이 파일 자체가 자료 칸을 가진 파일이 되어, 지어낸 이름이라도
    #   public_names 가 이 파일을 잡는다 — 실제로 잡혔고, 고쳐 놓고 나서
    #   **까닭을 적은 이 주석**이 또 잡혔다. 자가 옳다. 이름만 여기 두고 칸은
    #   J() 가 붙이면, 자가 보는 규칙은 그대로 재면서 이 파일은 조용하다.
    ('public_names 실명', lambda s: sorted(public_names.names_in(s)), [
        ('자료 칸에 든 이름은 잡는다',
         J('강해든') + '{"g":"중2"}', ['강해든']),
        # 처음엔 '…성 · …율 로 끝나면 화학 용어' 로 걸렀다. 그래서 그렇게
        # 끝나는 학생 넷이 통째로 안 보였고 쉰셋이 마흔아홉이 되었다.
        ('용어처럼 끝나는 이름도 사람이다',
         ''.join(J(n) for n in ('강해성', '강해율', '모해성', '모해율')),
         ['강해성', '강해율', '모해성', '모해율']),
        # 처음엔 값 **전체**가 이름일 때만 셌다. 동명이인이라 손으로 갈라 적어
        # 둔 이름이 그 때문에 숨었다 — 신경 쓴 이름일수록 안 보이는 꼴이었다.
        ('괄호로 갈라 적은 동명이인도 잡는다',
         J('강해든(내정중)'), ['강해든']),
        ('예시로 쓰는 이름은 안 잡는다',
         J('홍길동'), []),
        ('자료 칸 밖의 이름은 이 자가 못 본다 — 재는 것과 막는 것은 다르다',
         '<p>강해든 학생의 리포트입니다</p>', []),
    ]),
]


def main():
    check = '--check' in sys.argv
    bad = []
    total = 0
    print('자가 참·거짓 예시를 맞히는가\n')
    for name, fn, cases in CASES:
        ok = 0
        for label, given, want in cases:
            total += 1
            got = fn(given)
            if got == want:
                ok += 1
            else:
                bad.append('%s · %s → %r (맞아야 할 답 %r)' % (name, label, got, want))
        print('  %-24s %d/%d' % (name, ok, len(cases)))

    # 깨끗한 저장소에서 조용한지도 본다. 시끄러우면 사람이 안 본다.
    for rel in ('tools/audit_pages.py',):
        total += 1
        r = subprocess.run([sys.executable, os.path.join(ROOT, rel), '--check'],
                           cwd=ROOT, capture_output=True, text=True)
        noisy = '결함 있는 화면 0개' not in (r.stdout or '')
        if r.returncode == 0 and not noisy:
            print('  %-24s 깨끗한 저장소에서 조용하다' % os.path.basename(rel))
        else:
            bad.append('%s: 깨끗한 저장소인데 시끄럽다 — %s'
                       % (rel, (r.stdout or '').strip().splitlines()[-1:] or ['(말이 없다)']))

    print('\n예시 %d개' % total)
    if bad:
        print('\n자가 틀린 답을 냈다 %d곳:' % len(bad))
        for b in bad:
            print('  ' + b)
        print('\n**자를 먼저 본다.** 코드가 아니라 자가 틀렸을 수 있다.')
        return 1 if check else 0
    print('자들이 참·거짓을 그대로 답한다.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except BrokenPipeError:
        os._exit(0)
