import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, RefreshCw, Link2 } from "lucide-react";

type RelationshipType = {
  id: number; name: string; labelEn: string; labelTa: string | null; category: string | null; createdAt: string;
};

const CATEGORIES = ["immediate", "extended", "in-law"];

const categoryColour: Record<string, string> = {
  immediate: "bg-green-100 text-green-700",
  extended: "bg-blue-100 text-blue-700",
  "in-law": "bg-purple-100 text-purple-700",
};

function TypeDialog({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: RelationshipType }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: initial?.name ?? "", labelEn: initial?.labelEn ?? "", labelTa: initial?.labelTa ?? "", category: initial?.category ?? "immediate" });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (initial) return apiRequest("PUT", `/api/admin/relationship-types/${initial.id}`, data);
      return apiRequest("POST", "/api/admin/relationship-types", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/relationship-types"] });
      toast({ title: initial ? "Updated" : "Created", description: `Relationship type "${form.labelEn}" saved.` });
      onClose();
    },
    onError: (e: any) => toast({ title: "Error", description: e?.message ?? "Failed to save", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Relationship Type" : "Add Relationship Type"}</DialogTitle>
          <DialogDescription>Relationship types are used as labels in the family mapping.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label className="text-xs mb-1 block">Slug (unique key)</Label>
            <Input className="h-8 text-sm" placeholder="e.g. father" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} disabled={!!initial} />
          </div>
          <div><Label className="text-xs mb-1 block">English Label</Label>
            <Input className="h-8 text-sm" placeholder="e.g. Father" value={form.labelEn} onChange={e => setForm(f => ({ ...f, labelEn: e.target.value }))} />
          </div>
          <div><Label className="text-xs mb-1 block">Tamil Label (optional)</Label>
            <Input className="h-8 text-sm" placeholder="e.g. அப்பா" value={form.labelTa} onChange={e => setForm(f => ({ ...f, labelTa: e.target.value }))} />
          </div>
          <div><Label className="text-xs mb-1 block">Category</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-sm capitalize">{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.name || !form.labelEn}>
            {mutation.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RelationshipTypesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<RelationshipType | undefined>();
  const [deleting, setDeleting] = useState<RelationshipType | undefined>();

  const { data: types = [], isLoading, refetch } = useQuery<RelationshipType[]>({
    queryKey: ["/api/admin/relationship-types"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/relationship-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/relationship-types"] });
      toast({ title: "Deleted" });
      setDeleting(undefined);
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = types.filter(t => t.category === cat);
    return acc;
  }, {} as Record<string, RelationshipType[]>);
  grouped["other"] = types.filter(t => !t.category || !CATEGORIES.includes(t.category));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Link2 size={16} /> Relationship Types</CardTitle>
              <CardDescription>Master list of family relationship labels used across the system ({types.length} types)</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => refetch()}><RefreshCw size={13} /></Button>
              <Button size="sm" className="h-8 text-xs bg-saffron-500 hover:bg-saffron-600 text-white" onClick={() => setShowAdd(true)}>
                <Plus size={13} className="mr-1" /> Add Type
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-saffron-500 mx-auto" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slug</TableHead><TableHead>English</TableHead><TableHead>Tamil</TableHead>
                    <TableHead>Category</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {types.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs text-gray-500">{t.name}</TableCell>
                      <TableCell className="text-sm font-medium">{t.labelEn}</TableCell>
                      <TableCell className="text-sm">{t.labelTa ?? <span className="text-gray-300">—</span>}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColour[t.category ?? ""] ?? "bg-gray-100 text-gray-600"}`}>
                          {t.category ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(t)}><Pencil size={12} /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => setDeleting(t)}><Trash2 size={12} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {(showAdd || editing) && (
        <TypeDialog open={true} onClose={() => { setShowAdd(false); setEditing(undefined); }} initial={editing} />
      )}

      {/* Delete confirm */}
      <Dialog open={!!deleting} onOpenChange={v => !v && setDeleting(undefined)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete "{deleting?.labelEn}"?</DialogTitle>
            <DialogDescription>This cannot be undone. Existing relationship records using this type will keep their text value.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleting(undefined)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => deleting && deleteMutation.mutate(deleting.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
