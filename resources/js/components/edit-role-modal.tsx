import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { groupPermissionsByResource } from '@/lib/permissions';
import { update } from '@/routes/teams/roles';
import type { Role, Team } from '@/types';

type Props = {
    team: Team;
    permissions: string[];
    role: Role | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function EditRoleModal({
    team,
    permissions,
    role,
    open,
    onOpenChange,
}: Props) {
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => {
        setSelected(role?.permissions ?? []);
    }, [role]);

    const togglePermission = (permission: string, checked: boolean) => {
        setSelected((current) =>
            checked
                ? [...current, permission]
                : current.filter((name) => name !== permission),
        );
    };

    const groups = groupPermissionsByResource(permissions);

    if (!role) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <Form
                    key={String(open)}
                    {...update.form([team.slug, role.id])}
                    className="space-y-6"
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Edit role</DialogTitle>
                                <DialogDescription>
                                    Update the role name and its permissions.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-2">
                                <Label htmlFor="edit-role-name">
                                    Role name
                                </Label>
                                <Input
                                    id="edit-role-name"
                                    name="name"
                                    data-test="edit-role-name"
                                    defaultValue={role.name}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-4">
                                {Object.entries(groups).map(
                                    ([resource, resourcePermissions]) => (
                                        <div
                                            key={resource}
                                            className="space-y-2"
                                        >
                                            <div className="text-sm font-medium capitalize">
                                                {resource}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {resourcePermissions.map(
                                                    (permission) => (
                                                        <label
                                                            key={permission}
                                                            className="flex items-center gap-2 text-sm"
                                                        >
                                                            <Checkbox
                                                                checked={selected.includes(
                                                                    permission,
                                                                )}
                                                                onCheckedChange={(
                                                                    checked,
                                                                ) =>
                                                                    togglePermission(
                                                                        permission,
                                                                        checked ===
                                                                            true,
                                                                    )
                                                                }
                                                            />
                                                            {permission}
                                                        </label>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ),
                                )}

                                {selected.map((permission) => (
                                    <input
                                        key={permission}
                                        type="hidden"
                                        name="permissions[]"
                                        value={permission}
                                    />
                                ))}
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary">Cancel</Button>
                                </DialogClose>

                                <Button
                                    type="submit"
                                    data-test="edit-role-submit"
                                    disabled={processing}
                                >
                                    Save changes
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
