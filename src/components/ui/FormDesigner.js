'use client';

import { useState, useRef } from 'react';
import { GripVertical, X, Plus } from 'lucide-react';
import { getEntityFields, getDefaultLayout } from '@/lib/form-fields';
import Modal from './Modal';
import styles from './FormDesigner.module.css';

const COL_OPTIONS = [
  { value: 1, label: '1 col' },
  { value: 2, label: '2 cols' },
  { value: 3, label: '3 cols' },
];

export default function FormDesigner({ entityType, initialLayout, onSave, onClose, open }) {
  const [layout, setLayout] = useState(() => {
    const src = initialLayout || getDefaultLayout(entityType);
    return JSON.parse(JSON.stringify(src));
  });
  const [selectedSectionId, setSelectedSectionId] = useState(() => {
    const src = initialLayout || getDefaultLayout(entityType);
    return (src.sections[0] || {}).id || '';
  });
  const dragRef = useRef({});
  const [saving, setSaving] = useState(false);

  const allFields = getEntityFields(entityType);
  const fieldMap = {};
  for (const f of allFields) fieldMap[f.id] = f;

  const sectionList = [...layout.sections];
  const selectedSection = layout.sections.find(s => s.id === selectedSectionId);
  const sectionFieldIds = selectedSection ? selectedSection.fields : [];
  const sectionFields = sectionFieldIds.map(id => fieldMap[id]).filter(Boolean);
  const allAssignedFieldIds = new Set();
  for (const s of layout.sections) {
    for (const id of s.fields) allAssignedFieldIds.add(id);
  }
  const availableFields = allFields.filter(f => !allAssignedFieldIds.has(f.id));

  const sectionCols = selectedSection ? (selectedSection.columns || 1) : 1;
  const colClass = sectionCols === 1 ? styles.gridCols1 : sectionCols === 2 ? styles.gridCols2 : styles.gridCols3;

  const componentSections = layout.componentSections || [];

  function updateLayout(updater) {
    setLayout(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      updater(next);
      return next;
    });
  }

  function selectSection(sectionId) {
    setSelectedSectionId(sectionId);
  }

  function addNewSection() {
    const id = 'section_' + Date.now();
    updateLayout(l => {
      l.sections.push({
        id, title: 'Section ' + (l.sections.length + 1), columns: 1, visible: true, fields: [],
      });
    });
    setSelectedSectionId(id);
  }

  function deleteSection(sectionId) {
    if (layout.sections.length <= 1) return;
    updateLayout(l => {
      if (l.sections.length <= 1) return;
      const idx = l.sections.findIndex(s => s.id === sectionId);
      if (idx === -1) return;
      const orphanedFields = l.sections[idx].fields;
      l.sections.splice(idx, 1);
      if (orphanedFields.length > 0 && l.sections.length > 0) {
        const target = l.sections[0];
        for (const f of orphanedFields) {
          if (!target.fields.includes(f)) target.fields.push(f);
        }
      }
    });
    if (selectedSectionId === sectionId) {
      const remaining = sectionList.filter(s => s.id !== sectionId);
      const next = remaining[0];
      if (next) setSelectedSectionId(next.id);
    }
  }

  function renameSection(sectionId, title) {
    updateLayout(l => {
      const sec = l.sections.find(s => s.id === sectionId);
      if (sec && title.trim()) sec.title = title.trim();
    });
  }

  function handleSectionDragStart(e, idx) {
    dragRef.current = { type: 'section', idx };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  }

  function handleFieldDragStart(e, idx) {
    dragRef.current = { type: 'field', idx, sectionId: selectedSectionId };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  }

  function handleFieldDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleFieldDrop(e, toIdx) {
    e.preventDefault();
    const drag = dragRef.current;
    if (drag.type !== 'field' || drag.idx === null || drag.idx === toIdx) { dragRef.current = {}; return; }
    updateLayout(l => {
      const sec = l.sections.find(s => s.id === drag.sectionId);
      if (!sec) return;
      const [moved] = sec.fields.splice(drag.idx, 1);
      sec.fields.splice(toIdx, 0, moved);
    });
    dragRef.current = {};
  }

  function handleSectionDrop(e, toIdx, toSectionId) {
    e.preventDefault();
    const drag = dragRef.current;
    if (!drag.type) return;

    if (drag.type === 'section') {
      if (drag.idx === null || drag.idx === toIdx) { dragRef.current = {}; return; }
      updateLayout(l => {
        const [moved] = l.sections.splice(drag.idx, 1);
        l.sections.splice(toIdx, 0, moved);
      });
    } else if (drag.type === 'field') {
      // cross-section move
      if (drag.idx === null || !drag.sectionId || drag.sectionId === toSectionId) { dragRef.current = {}; return; }
      updateLayout(l => {
        const from = l.sections.find(s => s.id === drag.sectionId);
        const to = l.sections.find(s => s.id === toSectionId);
        if (!from || !to) return;
        const [moved] = from.fields.splice(drag.idx, 1);
        if (!to.fields.includes(moved)) to.fields.push(moved);
      });
    }
    dragRef.current = {};
  }

  function addFieldToSection(fieldId) {
    if (!selectedSectionId) return;
    updateLayout(l => {
      const sec = l.sections.find(s => s.id === selectedSectionId);
      if (!sec) return;
      if (!sec.fields.includes(fieldId)) sec.fields.push(fieldId);
    });
  }

  function removeFieldFromSection(fieldId) {
    if (!selectedSectionId) return;
    updateLayout(l => {
      const sec = l.sections.find(s => s.id === selectedSectionId);
      if (!sec) return;
      sec.fields = sec.fields.filter(id => id !== fieldId);
    });
  }

  function updateColumnCount(sectionId, count) {
    updateLayout(l => {
      const sec = l.sections.find(s => s.id === sectionId);
      if (sec) sec.columns = count;
    });
  }

  function toggleComponentSection(sectionId) {
    updateLayout(l => {
      if (!l.componentSections) return;
      const sec = l.componentSections.find(s => s.id === sectionId);
      if (sec) sec.visible = !sec.visible;
    });
  }

  function toggleFieldSection(sectionId) {
    updateLayout(l => {
      const sec = l.sections.find(s => s.id === sectionId);
      if (sec) sec.visible = !sec.visible;
    });
  }

  async function handleSave() {
    setSaving(true);
    await onSave(layout);
    setSaving(false);
  }

  function handleReset() {
    const def = getDefaultLayout(entityType);
    setLayout(JSON.parse(JSON.stringify(def)));
    setSelectedSectionId((def.sections[0] || {}).id || '');
  }

  return (
    <Modal
      title={`Form Designer — ${entityType}`}
      open={open}
      onClose={onClose}
      className={styles.modalOverride}
      headerClassName={styles.modalHeader}
    >
        <div className={styles.body}>
          {/* LEFT: Sections */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>Sections</div>
            </div>
            <div className={styles.panelBody}>
              {sectionList.map((sec, idx) => (
                <div key={sec.id}>
                  <div
                    className={selectedSectionId === sec.id ? styles.sectionItemActive : (dragRef.current.type === 'section' && dragRef.current.idx === idx ? styles.sectionItemDragging : styles.sectionItem)}
                    onClick={() => selectSection(sec.id)}
                    draggable
                    onDragStart={e => handleSectionDragStart(e, idx)}
                    onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                    onDrop={e => handleSectionDrop(e, idx, sec.id)}
                    onDragEnd={() => { dragRef.current = {}; }}
                  >
                    <span className={styles.dragHandle}><GripVertical size={12} /></span>
                    <span className={styles.sectionLabel}>{sec.title}</span>
                    {sec.fields && (
                      <span className={styles.componentBadge}>{sec.fields.length}</span>
                    )}
                    {layout.sections.length > 1 && (
                      <button
                        className={styles.deleteSectionBtn}
                        onClick={e => { e.stopPropagation(); deleteSection(sec.id); }}
                        title="Delete section"
                      >&times;</button>
                    )}
                  </div>
                </div>
              ))}
              <button className={styles.addSectionBtn} onClick={addNewSection}>
                <Plus size={12} /> New Section
              </button>

              {componentSections.length > 0 && (
                <>
                  <div style={{ padding: '0 0.5rem', marginTop: '0.5rem', fontSize: '0.625rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', letterSpacing: '0.05em' }}>Built-in</div>
                  {componentSections.map(sec => (
                    <div
                      key={sec.id}
                      className={selectedSectionId === sec.id ? styles.sectionItemActive : styles.sectionItem}
                      onClick={() => selectSection(sec.id)}
                    >
                      <span className={styles.sectionLabel}>{sec.title}</span>
                      <span className={styles.componentBadge}>component</span>
                      {sec.visible !== undefined && (
                        <input
                          type="checkbox"
                          checked={sec.visible}
                          onChange={() => toggleComponentSection(sec.id)}
                          onClick={e => e.stopPropagation()}
                          style={{ marginLeft: '0.25rem' }}
                        />
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* CENTER: Field Canvas */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              {selectedSection && selectedSection.fields !== undefined ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                  <input
                    className={styles.titleInput}
                    value={selectedSection.title}
                    onChange={e => renameSection(selectedSection.id, e.target.value)}
                    placeholder="Section title"
                    style={{ flex: 1 }}
                  />
                  <select
                    className={styles.colsSelect}
                    value={selectedSection.columns || 1}
                    onChange={e => updateColumnCount(selectedSection.id, parseInt(e.target.value))}
                  >
                    {COL_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <span className={styles.componentBadge}>{sectionFields.length} fields</span>
                </div>
              ) : (
                <div className={styles.panelTitle}>
                  {selectedSection ? selectedSection.title : 'Select a section'}
                </div>
              )}
            </div>
            <div className={styles.panelBody}>
              {selectedSection && selectedSection.fields !== undefined ? (
                sectionFields.length === 0 ? (
                  <div className={styles.emptyMsg}>No fields. Add from the right panel.</div>
                ) : (
                  <div className={`${styles.fieldGrid} ${colClass}`}>
                    {sectionFields.map((field, idx) => (
                      <div
                        key={field.id}
                        className={dragRef.current.type === 'field' && dragRef.current.idx === idx ? styles.fieldItemDragging : styles.fieldItem}
                        draggable
                        onDragStart={e => handleFieldDragStart(e, idx)}
                        onDragOver={e => handleFieldDragOver(e)}
                        onDrop={e => handleFieldDrop(e, idx)}
                        onDragEnd={() => { dragRef.current = {}; }}
                      >
                        <span className={styles.dragHandle}><GripVertical size={12} /></span>
                        <span className={styles.fieldLabel}>
                          {field.label}
                          {field.required && <span className={styles.required}>*</span>}
                        </span>
                        <span className={styles.fieldType}>{field.type}</span>
                        <button
                          className={styles.removeBtn}
                          onClick={() => removeFieldFromSection(field.id)}
                          title="Remove field"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className={styles.emptyMsg}>
                  {selectedSection
                    ? `This is a built-in component section.`
                    : 'Select a section from the left panel to edit its fields.'}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Available Fields */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>Available Fields</div>
            </div>
            <div className={styles.panelBody}>
              {selectedSection && selectedSection.fields !== undefined ? (
                availableFields.length === 0 ? (
                  <div className={styles.emptyMsg}>All fields added.</div>
                ) : (
                  availableFields.map(field => (
                    <div
                      key={field.id}
                      className={styles.addBtn}
                      onClick={() => addFieldToSection(field.id)}
                    >
                      <Plus size={12} />
                      <span className={styles.fieldLabel}>
                        {field.label}
                        {field.required && <span className={styles.required}>*</span>}
                      </span>
                      <span className={styles.fieldType}>{field.type}</span>
                    </div>
                  ))
                )
              ) : (
                <div className={styles.emptyMsg}>Select a field section to add fields.</div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <button className={styles.btnDanger} onClick={handleReset}>Reset to Default</button>
          </div>
          <div className={styles.footerRight}>
            <button className={styles.btn} onClick={onClose}>Cancel</button>
            <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Layout'}
            </button>
          </div>
        </div>
    </Modal>
  );
}
