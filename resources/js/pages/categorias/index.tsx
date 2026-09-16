import { Head, usePage } from '@inertiajs/react';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CreateCategoriaModal from '@/components/create-categoria-modal';
import DeleteCategoriaModal from '@/components/delete-categoria-modal';
import EditCategoriaModal from '@/components/edit-categoria-modal';
import Heading from '@/components/heading';
import SubcategoriasModal from '@/components/subcategorias-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { index } from '@/routes/categorias';
import type { Categoria } from '@/types';

type Props = {
    categorias: Categoria[];
};

export default function CategoriasIndex({ categorias }: Props) {
    const { currentTeam } = usePage().props;
    const currentTeamSlug = currentTeam?.slug ?? '';

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [categoriaEditing, setCategoriaEditing] = useState<Categoria | null>(
        null,
    );
    const [subCategoriasDialogOpen, setSubCategoriasDialogOpen] =
        useState(false);
    const [subCategoriasCategoriaId, setSubCategoriasCategoriaId] = useState<
        number | null
    >(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoriaDeleting, setCategoriaDeleting] =
        useState<Categoria | null>(null);

    const categoriaForSubCategorias =
        categorias.find(
            (categoria) => categoria.id === subCategoriasCategoriaId,
        ) ?? null;

    const openEditDialog = (categoria: Categoria) => {
        setCategoriaEditing(categoria);
        setEditDialogOpen(true);
    };

    const openSubCategoriasDialog = (categoria: Categoria) => {
        setSubCategoriasCategoriaId(categoria.id);
        setSubCategoriasDialogOpen(true);
    };

    const openDeleteDialog = (categoria: Categoria) => {
        setCategoriaDeleting(categoria);
        setDeleteDialogOpen(true);
    };

    return (
        <>
            <Head title="Categorías" />

            <h1 className="sr-only">Categorías</h1>

            <div className="flex flex-col space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Categorías"
                        description="Organiza tus productos en categorías y subcategorías"
                    />

                    <CreateCategoriaModal currentTeamSlug={currentTeamSlug}>
                        <Button data-test="categorias-new-categoria-button">
                            <Plus /> Nueva categoría
                        </Button>
                    </CreateCategoriaModal>
                </div>

                <div className="space-y-3">
                    {categorias.map((categoria) => (
                        <div
                            key={categoria.id}
                            data-test="categoria-row"
                            className="flex items-center justify-between gap-4 rounded-lg border p-4"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {categoria.nombre}
                                    </span>
                                    <Badge variant="secondary">
                                        {categoria.sub_categorias_count ?? 0}{' '}
                                        subcategorías
                                    </Badge>
                                    <Badge variant="secondary">
                                        {categoria.productos_count ?? 0}{' '}
                                        productos
                                    </Badge>
                                </div>
                                {categoria.descripcion ? (
                                    <p className="text-muted-foreground text-sm">
                                        {categoria.descripcion}
                                    </p>
                                ) : null}
                            </div>

                            <TooltipProvider>
                                <div className="flex items-center gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                data-test="categoria-subcategorias-button"
                                                onClick={() =>
                                                    openSubCategoriasDialog(
                                                        categoria,
                                                    )
                                                }
                                            >
                                                <Layers className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Subcategorías</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                data-test="categoria-edit-button"
                                                onClick={() =>
                                                    openEditDialog(categoria)
                                                }
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Editar categoría</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                data-test="categoria-delete-button"
                                                onClick={() =>
                                                    openDeleteDialog(categoria)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Eliminar categoría</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </TooltipProvider>
                        </div>
                    ))}

                    {categorias.length === 0 ? (
                        <p className="text-muted-foreground py-8 text-center">
                            Todavía no tienes categorías registradas.
                        </p>
                    ) : null}
                </div>
            </div>

            <EditCategoriaModal
                currentTeamSlug={currentTeamSlug}
                categoria={categoriaEditing}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <SubcategoriasModal
                currentTeamSlug={currentTeamSlug}
                categoria={categoriaForSubCategorias}
                open={subCategoriasDialogOpen}
                onOpenChange={setSubCategoriasDialogOpen}
            />

            {categoriaDeleting ? (
                <DeleteCategoriaModal
                    currentTeamSlug={currentTeamSlug}
                    categoria={categoriaDeleting}
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                />
            ) : null}
        </>
    );
}

CategoriasIndex.layout = (props: {
    currentTeam?: { slug: string } | null;
}) => ({
    breadcrumbs: [
        {
            title: 'Categorías',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
