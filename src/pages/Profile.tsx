import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getWasteStats } from "@/lib/wasteData";
import { Trophy, Percent, Edit2, Check, ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function Profile() {
    const { user, profile, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        owner_name: "",
        mobile_number: "",
        address: "",
        property_type: "",
        family_members: "",
        property_size: "",
    });

    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (profile) {
            setFormData({
                owner_name: profile.owner_name || "",
                mobile_number: profile.mobile_number || "",
                address: profile.address || "",
                property_type: profile.property_type || "",
                family_members: profile.family_members?.toString() || "",
                property_size: profile.property_size?.toString() || "",
            });
        }
    }, [profile]);

    useEffect(() => {
        if (user) {
            setStats(getWasteStats(user.id));

            const listener = () => setStats(getWasteStats(user.id));
            window.addEventListener('waste_data_updated', listener);
            return () => window.removeEventListener('waste_data_updated', listener);
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateProfile({
                owner_name: formData.owner_name,
                mobile_number: formData.mobile_number,
                address: formData.address,
                property_type: formData.property_type,
                family_members: parseInt(formData.family_members) || undefined,
                property_size: parseInt(formData.property_size) || undefined,
            });
            toast.success("Profile updated");
            setIsEditing(false);
        } catch (e: any) {
            toast.error(e.message || "Failed to edit profile");
        } finally {
            setLoading(false);
        }
    };

    if (!profile) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-6">

                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Profile</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2 border-green-100 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div>
                                <CardTitle className="text-xl">Personal Details</CardTitle>
                                <CardDescription>Manage your property and contact information</CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                disabled={loading}
                            >
                                {isEditing ? <Check className="w-4 h-4 text-green-600" /> : <Edit2 className="w-4 h-4" />}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-gray-500 text-xs">Full Name</Label>
                                    {isEditing ? (
                                        <Input value={formData.owner_name} onChange={e => setFormData({ ...formData, owner_name: e.target.value })} />
                                    ) : (
                                        <p className="font-medium">{profile.owner_name || '-'}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-gray-500 text-xs text-xs">Mobile Number</Label>
                                    {isEditing ? (
                                        <Input value={formData.mobile_number} onChange={e => setFormData({ ...formData, mobile_number: e.target.value })} />
                                    ) : (
                                        <p className="font-medium">{profile.mobile_number || '-'}</p>
                                    )}
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-gray-500 text-xs">Address</Label>
                                    {isEditing ? (
                                        <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                    ) : (
                                        <p className="font-medium">{profile.address || '-'}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-gray-500 text-xs">Property Type</Label>
                                    {isEditing ? (
                                        <Input value={formData.property_type} onChange={e => setFormData({ ...formData, property_type: e.target.value })} />
                                    ) : (
                                        <p className="font-medium">{profile.property_type || '-'}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-gray-500 text-xs">Family Members</Label>
                                    {isEditing ? (
                                        <Input type="number" value={formData.family_members} onChange={e => setFormData({ ...formData, family_members: e.target.value })} />
                                    ) : (
                                        <p className="font-medium">{profile.family_members || '-'}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-gray-500 text-xs">Property ID</Label>
                                    <p className="font-medium text-gray-600">{profile.property_id || '-'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl shadow-green-500/20 border-none">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-green-100 text-sm uppercase tracking-wider">Total Points</p>
                                        <h3 className="text-4xl font-bold mt-1">{profile.total_points || 0}</h3>
                                    </div>
                                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                        <Trophy className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/20 border-none">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-blue-100 text-sm uppercase tracking-wider">Tax Discount</p>
                                        <h3 className="text-4xl font-bold mt-1">{profile.tax_discount_eligibility || 0}%</h3>
                                    </div>
                                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                        <Percent className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {stats && (
                    <Card className="border-green-100 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">Waste Statistics Summary</CardTitle>
                            <CardDescription>Your current month waste generation breakdown</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="bg-green-50 p-4 rounded-xl">
                                    <p className="text-sm font-medium text-green-800">Monthly Wet</p>
                                    <p className="text-2xl font-bold mt-1 text-green-700">{stats.monthlyWet.toFixed(2)} kg</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-xl">
                                    <p className="text-sm font-medium text-blue-800">Monthly Dry</p>
                                    <p className="text-2xl font-bold mt-1 text-blue-700">{stats.monthlyDry.toFixed(2)} kg</p>
                                </div>
                                <div className="bg-gray-100 p-4 rounded-xl">
                                    <p className="text-sm font-medium text-gray-600">Total Monthly</p>
                                    <p className="text-2xl font-bold mt-1 text-gray-900">{stats.monthlyTotal.toFixed(2)} kg</p>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-xl">
                                    <p className="text-sm font-medium text-amber-800">Today</p>
                                    <p className="text-2xl font-bold mt-1 text-amber-700">{(stats.today.wet_waste_weight + stats.today.dry_waste_weight).toFixed(2)} kg</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
