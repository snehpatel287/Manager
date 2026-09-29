'use client';

import { useState } from 'react';
import { createProjectAction } from '@/app/actions';
import Icon from './Icon';
import ProjectFormModal from './ProjectFormModal';
import { buttonStyles } from './ui/button';

/** "Add Project" button that opens a dialog and redirects to the new project. */
export default function NewProjectButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={buttonStyles()} onClick={() => setOpen(true)}>
        <Icon name="plus" /> Add Project
      </button>

      <ProjectFormModal
        open={open}
        onClose={() => setOpen(false)}
        heading="New project"
        submitLabel="Create project"
        pendingLabel="Creating…"
        onSubmit={createProjectAction} // redirects on success
      />
    </>
  );
}
