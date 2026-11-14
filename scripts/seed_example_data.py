#!/usr/bin/env python3
"""Carga (o quita) swags de ejemplo en un backend desplegado, para tener algo que probar.

Sube las fotos de public/demo/ al bucket de S3 y escribe swags, reportes y concursos en DynamoDB.
Todo queda marcado con autor "Demo" y con ids que empiezan con "demo-", así que se puede borrar por completo.

    python3 scripts/seed_example_data.py load   --outputs /ruta/amplify_outputs.json
    python3 scripts/seed_example_data.py remove --outputs /ruta/amplify_outputs.json

Necesita AWS CLI con credenciales. Las fotos de public/demo/ no están en el repositorio (son de terceros).
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTOS = ['tote', 'termo', 'mochila', 'gorra', 'polo']
AUTHOR = 'Demo'
OWNER = 'demo::demo'  # nadie es dueño de estos registros: solo se editan desde AWS


def aws(*args, capture=True):
    r = subprocess.run(['aws', *args], capture_output=capture, text=True)
    if r.returncode != 0:
        sys.exit(f'aws {" ".join(args[:3])} falló:\n{r.stderr.strip()}')
    return r.stdout


def key(name):
    import re, unicodedata
    n = unicodedata.normalize('NFD', name.lower())
    n = ''.join(c for c in n if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]', '', n)


def iso(dt):
    return dt.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')


def build_items():
    now = datetime.now(timezone.utc)
    ago = lambda m: iso(now - timedelta(minutes=m))
    vegas = lambda day, hhmm: iso(datetime.fromisoformat(f'{day}T{hhmm}:00-08:00'))

    swags = [
        ('demo-s1', 'Nimbus Labs', 'Tote bag crema', 'Escanea tu gafete en el stand y llévate una. No piden datos de tu empresa.', 'Pasillo C, frente al escenario pequeño', 'tote', 14),
        ('demo-s2', 'Quark Cloud', 'Termo negro', 'Haz la demo de 5 minutos con alguien del equipo y te lo dan al terminar.', 'Esquina del Expo, entrada norte', 'termo', 40),
        ('demo-s4', 'Helix Data', 'Mochila blanca', 'Anótate al sorteo en el stand y vuelve a las 3 pm a la hora exacta.', 'Stand 980, segundo piso', 'mochila', 35),
        ('demo-s6', 'Nimbus Labs', 'Stickers holográficos', 'Están en la mesa de la derecha, sin hacer nada.', 'Pasillo C, mesa de la derecha', None, 50),
        ('demo-s5', 'Pixel Forge', 'Gorra #swag', 'Responde 3 preguntas en el stand y te la llevas.', 'Mesa junto a la entrada', 'gorra', 75),
        ('demo-s3', 'Vector Systems', 'Polo verde edición limitada', 'Fila corta antes de las 10 am. Después se acaban las tallas M y L.', 'Stand 1420, al lado del café', 'polo', 190),
    ]
    reports = [
        ('demo-r1', 'demo-s1', 'STILL_THERE', None, 3), ('demo-r2', 'demo-s2', 'STILL_THERE', None, 12),
        ('demo-r3', 'demo-s4', 'STILL_THERE', None, 30),
        ('demo-r4', 'demo-s4', 'TIP', 'Solo participan quienes se anotan antes de las 3 pm. Llega temprano.', 26),
        ('demo-r5', 'demo-s4', 'STILL_THERE', None, 20), ('demo-r6', 'demo-s6', 'STILL_THERE', None, 40),
        ('demo-r7', 'demo-s5', 'STILL_THERE', None, 60),
        ('demo-r8', 'demo-s3', 'GONE', None, 80), ('demo-r9', 'demo-s3', 'GONE', None, 70),
    ]
    contests = [
        ('demo-c1', 'Helix Data', 'Sorteo de mochila', 'Estar en el stand a la hora exacta. Si no estás, sortean otra vez.', 'TIMED', ('2026-12-01', '17:55'), 'Stand 980, segundo piso'),
        ('demo-c4', 'Nimbus Labs', 'Demo + tote bag', 'Pasa por el stand, mira la demo y escanea tu gafete.', 'VISIT', ('2026-12-01', '21:30'), 'Pasillo C'),
        ('demo-c2', 'Quark Cloud', 'Rifa de termos', 'Pide un número en el mostrador antes de las 8 pm y vuelve al sorteo.', 'TICKET', ('2026-12-01', '23:30'), 'Esquina del Expo, entrada norte'),
        ('demo-c3', 'Pixel Forge', 'Reto de gorra #swag', 'Resuelve el reto en 10 minutos. Ganan los 3 más rápidos.', 'VISIT', ('2026-12-02', '19:30'), 'Mesa junto a la entrada'),
    ]

    def S(v):
        return {'S': v}

    def base(typ, id_, created):
        return {'id': S(id_), '__typename': S(typ), 'createdAt': S(created), 'updatedAt': S(created), 'owner': S(OWNER), 'authorName': S(AUTHOR)}

    out = {'Swag': [], 'SwagReport': [], 'Contest': []}
    for id_, company, title, how, ref, photo, m in swags:
        it = base('Swag', id_, ago(m))
        it.update({'company': S(company), 'companyKey': S(key(company)), 'title': S(title), 'howTo': S(how), 'reference': S(ref)})
        if photo:
            it['photoKey'] = S(f'photos/demo/{photo}.jpg')
        out['Swag'].append(it)
    for id_, swag, kind, text, m in reports:
        it = base('SwagReport', id_, ago(m))
        it.update({'swagId': S(swag), 'kind': S(kind)})
        if text:
            it['text'] = S(text)
        out['SwagReport'].append(it)
    for id_, company, title, how, kind, (day, hhmm), ref in contests:
        it = base('Contest', id_, ago(90))
        it.update({'company': S(company), 'companyKey': S(key(company)), 'title': S(title), 'howTo': S(how), 'kind': S(kind),
                   'startsAt': S(vegas(day, hhmm)), 'reference': S(ref)})
        out['Contest'].append(it)
    return out


def resources(outputs_path):
    o = json.load(open(outputs_path))
    region, bucket, url = o['data']['aws_region'], o['storage']['bucket_name'], o['data']['url']
    apis = json.loads(aws('appsync', 'list-graphql-apis', '--region', region, '--output', 'json'))['graphqlApis']
    api = next((a for a in apis if a.get('uris', {}).get('GRAPHQL') == url), None)
    if not api:
        sys.exit('No encontré la API de AppSync de estos outputs.')
    return region, bucket, api['apiId']


def batch(region, table, requests):
    for i in range(0, len(requests), 25):
        payload = {table: requests[i:i + 25]}
        with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as f:
            json.dump(payload, f)
        aws('dynamodb', 'batch-write-item', '--region', region, '--request-items', f'file://{f.name}')
        os.unlink(f.name)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('action', choices=['load', 'remove'])
    ap.add_argument('--outputs', required=True, help='amplify_outputs.json del backend de destino')
    a = ap.parse_args()
    region, bucket, api_id = resources(a.outputs)
    items = build_items()
    print(f'Destino: bucket {bucket} · API {api_id} · {region}')

    if a.action == 'load':
        for p in PHOTOS:
            path = os.path.join(ROOT, 'public', 'demo', f'{p}.jpg')
            if not os.path.exists(path):
                sys.exit(f'Falta la foto {path}')
            aws('s3', 'cp', path, f's3://{bucket}/photos/demo/{p}.jpg', '--content-type', 'image/jpeg', '--region', region, '--only-show-errors')
        print(f'Fotos subidas: {len(PHOTOS)}')
        for model, rows in items.items():
            batch(region, f'{model}-{api_id}-NONE', [{'PutRequest': {'Item': r}} for r in rows])
            print(f'{model}: {len(rows)} escritos')
    else:
        for model, rows in items.items():
            batch(region, f'{model}-{api_id}-NONE', [{'DeleteRequest': {'Key': {'id': r['id']}}} for r in rows])
            print(f'{model}: {len(rows)} borrados')
        aws('s3', 'rm', f's3://{bucket}/photos/demo/', '--recursive', '--region', region, '--only-show-errors')
        print('Fotos borradas de S3')


if __name__ == '__main__':
    main()
