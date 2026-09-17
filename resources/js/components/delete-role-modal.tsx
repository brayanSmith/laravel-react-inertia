import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { destroy } from '@/routes/teams/roles';
import type { Role, Team } from '@/types';

type Props = {
    team: Team;
    role: Role | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteRoleModal({
    team,
    role,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const deleteRole = () => {
        if (!role) {
            return;
        }

        router.visit(destroy([team.slug, role.id]), {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete role</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete the role{' '}
                        <strong>"{role?.name}"</strong>? Members who have this
                        role will lose the permissions it grants.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancel</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        data-test="delete-role-confirm"
                        disabled={processing}
                        onClick={deleteRole}
                    >
                        Delete role
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
