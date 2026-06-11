"use client";

import { useState, useEffect, useCallback } from "react";
import { EmployeeList } from "@/components/employees/employee-list";
import { EmployeeForm } from "@/components/employees/employee-form";
import { api } from "@/lib/api";

interface Specialist {
  id: string;
  full_name: string;
  photo_url: string | null;
  specialization: string | null;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Specialist | null>(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ specialists: Specialist[] }>(
        "/api/business/specialists"
      );
      setEmployees(res.specialists);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  function handleEdit(e: Specialist) {
    setEditing(e);
    setFormOpen(true);
  }

  function handleAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function handleSaved() {
    setEditing(null);
    loadEmployees();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Сотрудники</h1>
      </div>

      <EmployeeList
        employees={employees}
        loading={loading}
        onEdit={handleEdit}
        onAdd={handleAdd}
        onRefresh={loadEmployees}
      />

      <EmployeeForm
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSaved={handleSaved}
        initial={editing ?? undefined}
      />
    </div>
  );
}
