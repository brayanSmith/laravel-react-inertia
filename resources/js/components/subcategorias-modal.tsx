import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import DeleteSubcategoriaModal from '@/components/delete-subcategoria-modal';
import SubcategoriaModal from '@/components/subcategoria-modal';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Categoria, SubCategoria } from '@/types';

type Props = {
    currentTeamSlug: string;
    categoria: Categoria | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function SubcategoriasModal({
    currentTeamSlug,
    categoria,
    open,
    onOpenChange,
}: Props) {
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [subCategoriaEditing, setSubCategoriaEditing] =
        useState<SubCategoria | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [subCategoriaDeleting, setSubCategoriaDeleting] =
        useState<SubCategoria | null>(null);

    const openAdd = () => {
        setSubCategoriaEditing(null);
        setFormDialogOpen(true);
    };

    const openEdit = (subCategoria: SubCategoria) => {
        setSubCategoriaEditing(subCategoria);
        setFormDialogOpen(true);
    };

    const openDelete = (subCategoria: SubCategoria) => {
        setSubCategoriaDeleting(subCategoria);
        setDeleteDialogOpen(true);
    };

    if (!categoria) {
        return null;
    }

    const subCategorias = categoria.sub_categorias ?? [];

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Subcategorías de {categoria.nombre}
                        </DialogTitle>
                        <DialogDescription>
                            Administra las subcategorías de esta categoría.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end">
                        <Button
                            size="sm"
                            data-test="add-subcategoria-button"
                            onClick={openAdd}
                        >
                            <Plus /> Nueva subcategoría
                        </Button>
                    </div>

                    <div className="max-h-80 space-y-3 overflow-y-auto">
                        {subCategorias.map((subCategoria) => (
                            <div
                                key={subCategoria.id}
                                data-test="subcategoria-row"
                                className="flex items-center justify-between rounded-lg border p-3"
                            >
                                <div>
                                    <div className="font-medium">
                                        {subCategoria.nombre}
                                    </div>
                                    {subCategoria.descripcion ? (
                                        <div className="text-muted-foreground text-sm">
                                            {subCategoria.descripcion}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        data-test="subcategoria-edit-button"
                                        onClick={() => openEdit(subCategoria)}
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        data-test="subcategoria-delete-button"
                                        onClick={() => openDelete(subCategoria)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {subCategorias.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center">
                                Esta categoría todavía no tiene subcategorías.
                            </p>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>

            <SubcategoriaModal
                currentTeamSlug={currentTeamSlug}
                categoria={categoria}
                subCategoria={subCategoriaEditing}
                open={formDialogOpen}
                onOpenChange={setFormDialogOpen}
            />

            <DeleteSubcategoriaModal
                currentTeamSlug={currentTeamSlug}
                categoria={categoria}
                subCategoria={subCategoriaDeleting}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}
