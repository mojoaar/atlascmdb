import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../../../lib/db';
import { requireEditor } from '../../../../lib/rbac';
import { handleApiError, success } from '../../../../lib/api-helpers';

async function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).filter(l => l.trim()).map((line, idx) => {
    const values = parseLine(line);
    const row = { rowNumber: idx };
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });

  return { headers, rows };
}

async function parseJSON(content) {
  const data = JSON.parse(content);
  const items = Array.isArray(data) ? data : (data.items || data.data || []);
  return { headers: items.length ? Object.keys(items[0]) : [], rows: items.map((item, idx) => ({ rowNumber: idx, ...item })) };
}

export async function POST(request) {
  try {
    const auth = await requireEditor()(request);
    if (!auth.authorized) return NextResponse.json(auth.body, { status: auth.status });

    const contentType = request.headers.get('content-type') || '';
    let filename, content;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      filename = file.name;
      content = await file.text();
    } else {
      const body = await request.json();
      if (!body.content) return NextResponse.json({ error: 'No file content provided' }, { status: 400 });
      filename = body.filename || 'upload.json';
      content = body.content;
    }

    const isCSV = filename.endsWith('.csv');
    const { headers, rows } = isCSV ? await parseCSV(content) : await parseJSON(content);

    if (!headers.length || !rows.length) {
      return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
    }

    const db = getDb();
    const setId = uuidv4();
    const sourceName = filename.replace(/\.(csv|json)$/i, '');

    await db('import_sets').insert({
      id: setId, name: sourceName, sourceType: isCSV ? 'csv' : 'json',
      sourceName, status: 'uploaded', createdBy: auth.user.id,
    });

    const rowData = rows.map((row, idx) => ({
      id: uuidv4(), importSetId: setId, rowNumber: idx,
      rawData: JSON.stringify(row), status: 'pending',
    }));

    let mappingPromises;
    if (rowData.length <= 250) {
      await db('import_set_rows').insert(rowData);
    } else {
      for (let i = 0; i < rowData.length; i += 250) {
        await db('import_set_rows').insert(rowData.slice(i, i + 250));
      }
    }

    return success({
      id: setId,
      name: sourceName,
      status: 'uploaded',
      rowCount: rows.length,
      columns: headers,
    });
  } catch (error) {
    return handleApiError(error, 'Upload failed');
  }
}
