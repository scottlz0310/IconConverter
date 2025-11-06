#!/bin/bash

# リリース準備スクリプト
# 
# このスクリプトは、新しいリリースを準備するための対話的なツールです。
# バージョン番号の更新、CHANGELOG の更新、タグの作成を支援します。
#
# 使用方法:
#   ./build/prepare-release.sh

set -e

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ヘルパー関数
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 現在のバージョンを取得
get_current_version() {
    node -p "require('./package.json').version"
}

# バージョン番号の検証
validate_version() {
    local version=$1
    if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
        return 1
    fi
    return 0
}

# Gitの状態を確認
check_git_status() {
    if [[ -n $(git status -s) ]]; then
        print_warning "作業ディレクトリに未コミットの変更があります"
        git status -s
        echo ""
        read -p "続行しますか？ (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "リリース準備を中止しました"
            exit 1
        fi
    fi
}

# ブランチを確認
check_branch() {
    local current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "main" && "$current_branch" != "master" ]]; then
        print_warning "現在のブランチは '$current_branch' です"
        read -p "mainブランチに切り替えますか？ (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git checkout main 2>/dev/null || git checkout master 2>/dev/null || {
                print_error "mainまたはmasterブランチに切り替えられませんでした"
                exit 1
            }
        fi
    fi
}

# バージョンタイプを選択
select_version_type() {
    local current_version=$1
    
    echo ""
    print_info "現在のバージョン: $current_version"
    echo ""
    echo "バージョンタイプを選択してください:"
    echo "  1) パッチ (バグ修正)"
    echo "  2) マイナー (新機能)"
    echo "  3) メジャー (破壊的変更)"
    echo "  4) プレリリース"
    echo "  5) カスタム"
    echo ""
    read -p "選択 (1-5): " -n 1 -r version_type
    echo ""
    
    case $version_type in
        1)
            npm version patch --no-git-tag-version
            ;;
        2)
            npm version minor --no-git-tag-version
            ;;
        3)
            npm version major --no-git-tag-version
            ;;
        4)
            read -p "プレリリース識別子 (例: beta, alpha, rc): " prerelease_id
            npm version prerelease --preid="$prerelease_id" --no-git-tag-version
            ;;
        5)
            read -p "新しいバージョン番号を入力: " custom_version
            if ! validate_version "$custom_version"; then
                print_error "無効なバージョン番号です"
                exit 1
            fi
            npm version "$custom_version" --no-git-tag-version
            ;;
        *)
            print_error "無効な選択です"
            exit 1
            ;;
    esac
}

# CHANGELOGを更新
update_changelog() {
    local version=$1
    local date=$(date +%Y-%m-%d)
    
    print_info "CHANGELOGを更新しています..."
    
    # CHANGELOGが存在しない場合は作成
    if [[ ! -f CHANGELOG.md ]]; then
        cat > CHANGELOG.md << EOF
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

EOF
    fi
    
    # 新しいバージョンセクションを追加
    local temp_file=$(mktemp)
    local header_found=false
    
    while IFS= read -r line; do
        echo "$line" >> "$temp_file"
        if [[ "$line" == "# Changelog" ]] && [[ "$header_found" == false ]]; then
            header_found=true
            echo "" >> "$temp_file"
            echo "## [$version] - $date" >> "$temp_file"
            echo "" >> "$temp_file"
            echo "### 追加" >> "$temp_file"
            echo "- " >> "$temp_file"
            echo "" >> "$temp_file"
            echo "### 変更" >> "$temp_file"
            echo "- " >> "$temp_file"
            echo "" >> "$temp_file"
            echo "### 修正" >> "$temp_file"
            echo "- " >> "$temp_file"
            echo "" >> "$temp_file"
        fi
    done < CHANGELOG.md
    
    mv "$temp_file" CHANGELOG.md
    
    print_success "CHANGELOGに新しいセクションを追加しました"
    print_warning "CHANGELOG.mdを編集して変更内容を記入してください"
    
    # エディタで開く
    if command -v code &> /dev/null; then
        code CHANGELOG.md
    elif command -v vim &> /dev/null; then
        vim CHANGELOG.md
    elif command -v nano &> /dev/null; then
        nano CHANGELOG.md
    else
        print_info "エディタが見つかりません。手動でCHANGELOG.mdを編集してください"
    fi
    
    echo ""
    read -p "CHANGELOGの編集が完了しましたか？ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "リリース準備を中止しました"
        exit 1
    fi
}

# リリースノートをプレビュー
preview_release_notes() {
    local version=$1
    
    print_info "リリースノートをプレビューしています..."
    echo ""
    
    node build/generate-release-notes.js "$version"
    
    echo ""
    read -p "リリースノートは正しいですか？ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "リリース準備を中止しました"
        exit 1
    fi
}

# 変更をコミット
commit_changes() {
    local version=$1
    
    print_info "変更をコミットしています..."
    
    git add package.json package-lock.json CHANGELOG.md
    git commit -m "chore: bump version to $version"
    
    print_success "変更をコミットしました"
}

# タグを作成
create_tag() {
    local version=$1
    local tag="v$version"
    
    print_info "タグを作成しています: $tag"
    
    git tag -a "$tag" -m "Release $version"
    
    print_success "タグを作成しました: $tag"
}

# プッシュ
push_changes() {
    local version=$1
    local tag="v$version"
    
    echo ""
    print_warning "以下の操作を実行します:"
    echo "  1. コミットをプッシュ"
    echo "  2. タグをプッシュ (リリースプロセスが自動開始されます)"
    echo ""
    read -p "続行しますか？ (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "変更をプッシュしています..."
        git push origin HEAD
        
        print_info "タグをプッシュしています..."
        git push origin "$tag"
        
        print_success "プッシュが完了しました"
        echo ""
        print_info "GitHub Actionsでビルドが開始されます"
        print_info "進行状況: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
    else
        print_warning "プッシュをスキップしました"
        print_info "後で手動でプッシュする場合:"
        echo "  git push origin HEAD"
        echo "  git push origin $tag"
    fi
}

# メイン処理
main() {
    echo ""
    echo "========================================="
    echo "  IconConverter リリース準備ツール"
    echo "========================================="
    echo ""
    
    # 前提条件のチェック
    print_info "前提条件をチェックしています..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.jsがインストールされていません"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Gitがインストールされていません"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npmがインストールされていません"
        exit 1
    fi
    
    print_success "前提条件を満たしています"
    
    # Gitの状態を確認
    check_git_status
    check_branch
    
    # 現在のバージョンを取得
    current_version=$(get_current_version)
    
    # バージョンを更新
    select_version_type "$current_version"
    new_version=$(get_current_version)
    
    print_success "バージョンを更新しました: $current_version → $new_version"
    
    # CHANGELOGを更新
    update_changelog "$new_version"
    
    # リリースノートをプレビュー
    preview_release_notes "$new_version"
    
    # 変更をコミット
    commit_changes "$new_version"
    
    # タグを作成
    create_tag "$new_version"
    
    # プッシュ
    push_changes "$new_version"
    
    echo ""
    print_success "リリース準備が完了しました！"
    echo ""
}

# スクリプトを実行
main
