import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Network, BarChart3, TrendingUp, MapPin, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Member, Relationship } from "@shared/schema";
import { useFormDataTransformation } from "@/lib/i18n-utils";

interface NetworkAnalysisProps {
  allMembers: Member[];
  allRelationships: Array<Relationship & { relatedMember: Member }>;
  onMemberClick?: (memberId: number) => void;
}

interface FamilyCluster {
  id: string;
  members: Member[];
  connections: number;
  generations: number;
  locations: string[];
}

export function FamilyNetworkAnalysis({ allMembers, allRelationships, onMemberClick }: NetworkAnalysisProps) {
  const { t } = useTranslation();
  const { transformMemberData, transformRelationshipData } = useFormDataTransformation();
  // Analyze family clusters and networks
  const analyzeFamilyNetwork = () => {
    const memberConnections: { [memberId: number]: Set<number> } = {};
    const clusters: FamilyCluster[] = [];
    const visited = new Set<number>();

    // Build connection graph
    allRelationships.forEach((rel) => {
      if (!memberConnections[rel.memberId]) {
        memberConnections[rel.memberId] = new Set();
      }
      if (!memberConnections[rel.relatedMemberId]) {
        memberConnections[rel.relatedMemberId] = new Set();
      }
      memberConnections[rel.memberId].add(rel.relatedMemberId);
      memberConnections[rel.relatedMemberId].add(rel.memberId);
    });

    // Find connected components (family clusters)
    const findCluster = (startMemberId: number): Member[] => {
      const cluster: Member[] = [];
      const queue = [startMemberId];
      const clusterVisited = new Set<number>();

      while (queue.length > 0) {
        const memberId = queue.shift()!;
        if (clusterVisited.has(memberId)) continue;
        
        clusterVisited.add(memberId);
        visited.add(memberId);
        
        const member = allMembers.find(m => m.id === memberId);
        if (member) {
          cluster.push(member);
        }

        const connections = memberConnections[memberId] || new Set();
        connections.forEach(connectedId => {
          if (!clusterVisited.has(connectedId)) {
            queue.push(connectedId);
          }
        });
      }

      return cluster;
    };

    // Create clusters
    allMembers.forEach(member => {
      if (!visited.has(member.id) && memberConnections[member.id]) {
        const clusterMembers = findCluster(member.id);
        if (clusterMembers.length > 1) {
          const locations = [...new Set(clusterMembers.map(m => `${m.currentCity}, ${m.currentState}`))];
          clusters.push({
            id: `cluster-${clusters.length}`,
            members: clusterMembers,
            connections: clusterMembers.reduce((sum, m) => sum + (memberConnections[m.id]?.size || 0), 0) / 2,
            generations: calculateGenerations(clusterMembers, allRelationships),
            locations
          });
        }
      }
    });

    return clusters.sort((a, b) => b.members.length - a.members.length);
  };

  const calculateGenerations = (members: Member[], relationships: Array<Relationship & { relatedMember: Member }>) => {
    const memberRelationships = relationships.filter(rel => 
      members.some(m => m.id === rel.memberId) && members.some(m => m.id === rel.relatedMemberId)
    );

    const generationTypes = new Set(memberRelationships.map(rel => {
      const type = rel.relationshipType.toLowerCase();
      if (['grandfather', 'grandmother'].includes(type)) return 'grandparent';
      if (['father', 'mother'].includes(type)) return 'parent';
      if (['child'].includes(type)) return 'child';
      return 'same';
    }));

    return generationTypes.size;
  };

  const getRelationshipStats = () => {
    const stats = {
      total: allRelationships.length,
      byType: {} as { [key: string]: number },
      mostConnected: null as Member | null,
      avgConnections: 0
    };

    // Count by relationship type
    allRelationships.forEach(rel => {
      stats.byType[rel.relationshipType] = (stats.byType[rel.relationshipType] || 0) + 1;
    });

    // Find most connected member
    const connectionCounts: { [memberId: number]: number } = {};
    allRelationships.forEach(rel => {
      connectionCounts[rel.memberId] = (connectionCounts[rel.memberId] || 0) + 1;
    });

    let maxConnections = 0;
    let mostConnectedId = 0;
    Object.entries(connectionCounts).forEach(([memberId, count]) => {
      if (count > maxConnections) {
        maxConnections = count;
        mostConnectedId = parseInt(memberId);
      }
    });

    stats.mostConnected = allMembers.find(m => m.id === mostConnectedId) || null;
    stats.avgConnections = Object.values(connectionCounts).reduce((sum, count) => sum + count, 0) / Object.keys(connectionCounts).length || 0;

    return stats;
  };

  const clusters = analyzeFamilyNetwork();
  const stats = getRelationshipStats();

  return (
    <div className="space-y-6">
      {/* Network Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center bg-gradient-to-br from-saffron-50 to-gold-50">
          <Network className="mx-auto mb-2 text-saffron-600" size={24} />
          <div className="text-2xl font-bold text-temple-brown">{clusters.length}</div>
          <div className="text-sm text-gray-600">{t('familyTree.familyClusters', 'Family Clusters')}</div>
        </Card>
        <Card className="p-4 text-center bg-gradient-to-br from-temple-light to-saffron-50">
          <Users className="mx-auto mb-2 text-temple-brown" size={24} />
          <div className="text-2xl font-bold text-temple-brown">{stats.total}</div>
          <div className="text-sm text-gray-600">{t('familyTree.totalConnections', 'Total Connections')}</div>
        </Card>
        <Card className="p-4 text-center bg-gradient-to-br from-gold-50 to-yellow-50">
          <TrendingUp className="mx-auto mb-2 text-temple-gold" size={24} />
          <div className="text-2xl font-bold text-temple-brown">{stats.avgConnections.toFixed(1)}</div>
          <div className="text-sm text-gray-600">{t('familyTree.avgConnections', 'Avg Connections')}</div>
        </Card>
        <Card className="p-4 text-center bg-gradient-to-br from-temple-gold-50 to-saffron-50">
          <BarChart3 className="mx-auto mb-2 text-saffron-500" size={24} />
          <div className="text-2xl font-bold text-temple-brown">
            {Object.keys(stats.byType).length}
          </div>
          <div className="text-sm text-gray-600">{t('familyTree.relationshipTypes', 'Relationship Types')}</div>
        </Card>
      </div>

      {/* Most Connected Member */}
      {stats.mostConnected && (
        <Card className="p-6 bg-gradient-to-r from-saffron-500 to-gold-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">{t('familyTree.mostConnectedMember', 'Most Connected Family Member')}</h3>
              <p className="text-xl font-bold">{stats.mostConnected.fullName}</p>
              <p className="text-saffron-100 text-sm">
                {Object.values(stats.byType).reduce((max, count) => Math.max(max, count), 0)} family connections
              </p>
            </div>
            <Button 
              variant="outline" 
              className="bg-white text-temple-brown hover:bg-gray-100"
              onClick={() => onMemberClick?.(stats.mostConnected!.id)}
            >
              View Profile
            </Button>
          </div>
        </Card>
      )}

      {/* Family Clusters */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-temple-brown">Family Clusters</h3>
        {clusters.length > 0 ? (
          <div className="grid gap-4">
            {clusters.map((cluster, index) => (
              <Card key={cluster.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-temple-brown">
                      Family Cluster #{index + 1}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                      <span className="flex items-center">
                        <Users className="mr-1" size={14} />
                        {cluster.members.length} members
                      </span>
                      <span className="flex items-center">
                        <Network className="mr-1" size={14} />
                        {cluster.connections} connections
                      </span>
                      <span className="flex items-center">
                        <BarChart3 className="mr-1" size={14} />
                        {cluster.generations} generations
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-saffron-100 text-saffron-800">
                    {cluster.members.length} Members
                  </Badge>
                </div>

                {/* Cluster Members */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  {cluster.members.slice(0, 6).map((member) => (
                    <div 
                      key={member.id} 
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => onMemberClick?.(member.id)}
                    >
                      <div className="w-8 h-8 bg-saffron-200 rounded-full flex items-center justify-center">
                        <Users className="text-temple-brown" size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{member.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {member.currentCity}, {member.currentState}
                        </p>
                      </div>
                    </div>
                  ))}
                  {cluster.members.length > 6 && (
                    <div className="flex items-center justify-center p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
                      +{cluster.members.length - 6} more members
                    </div>
                  )}
                </div>

                {/* Cluster Locations */}
                <div>
                  <h5 className="font-medium text-temple-brown mb-2">Geographic Distribution</h5>
                  <div className="flex flex-wrap gap-2">
                    {cluster.locations.slice(0, 5).map((location, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <MapPin className="mr-1" size={10} />
                        {location}
                      </Badge>
                    ))}
                    {cluster.locations.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{cluster.locations.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Network className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Family Clusters Found</h3>
            <p className="text-gray-500">Start adding family relationships to see network analysis</p>
          </Card>
        )}
      </div>

      {/* Relationship Type Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-temple-brown mb-4">Relationship Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-temple-brown">{count}</div>
              <div className="text-sm text-gray-600">{type}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}